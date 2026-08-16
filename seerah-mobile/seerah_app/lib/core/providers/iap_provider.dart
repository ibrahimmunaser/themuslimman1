import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:in_app_purchase_android/in_app_purchase_android.dart';

import '../constants/app_constants.dart';
import '../network/api_client.dart';
import '../network/cookie_helper.dart' as cookies;
import 'auth_provider.dart';
import 'profiles_provider.dart';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

enum IAPStatus {
  idle,
  loading,
  purchasing,
  verifying,
  success,
  /// An unacknowledged purchase arrived before the user authenticated.
  /// Requires sign-in to claim. Shown as a recovery banner on the landing screen.
  pendingLink,
  error,
  cancelled,
  /// restorePurchases() completed — no prior purchases found.
  restoreEmpty,
}

class IAPState {
  final IAPStatus status;
  final bool isAvailable;
  final List<ProductDetails> products;
  final List<String> notFoundIds;
  final String? errorMessage;
  final String? successProductId;

  /// Product the user tapped before authentication.
  /// The notifier auto-buys this after successful login.
  final String? pendingIntentProductId;

  /// Purchases that arrived via the OS stream before the user was logged in.
  /// Shown as a recovery banner; verified automatically after sign-in.
  ///
  /// Audit M-dropped-purchase: this used to be a single `PurchaseDetails?`
  /// slot. If a second unclaimed purchase arrived (e.g. a subscription
  /// renewal replay for one product landing while an original purchase for
  /// a DIFFERENT product was still sitting unclaimed, both while genuinely
  /// signed out) `copyWith(pendingLinkPurchase: purchase)` silently
  /// overwrote the first one in app state with no trace — the recovery
  /// banner only ever showed the newest arrival, so the older purchase
  /// could never be claimed/verified from this screen (iOS: only
  /// recoverable via Restore Purchases replaying the StoreKit queue;
  /// Android: could auto-refund after ~3 days unacknowledged). A list lets
  /// every unclaimed purchase be tracked and eventually claimed.
  final List<PurchaseDetails> pendingLinkPurchases;

  const IAPState({
    this.status = IAPStatus.loading,
    this.isAvailable = false,
    this.products = const [],
    this.notFoundIds = const [],
    this.errorMessage,
    this.successProductId,
    this.pendingIntentProductId,
    this.pendingLinkPurchases = const [],
  });

  IAPState copyWith({
    IAPStatus? status,
    bool? isAvailable,
    List<ProductDetails>? products,
    List<String>? notFoundIds,
    String? errorMessage,
    String? successProductId,
    String? pendingIntentProductId,
    bool clearPendingIntent = false,
    List<PurchaseDetails>? pendingLinkPurchases,
  }) {
    return IAPState(
      status: status ?? this.status,
      isAvailable: isAvailable ?? this.isAvailable,
      products: products ?? this.products,
      notFoundIds: notFoundIds ?? this.notFoundIds,
      errorMessage: errorMessage,
      successProductId: successProductId ?? this.successProductId,
      pendingIntentProductId: clearPendingIntent
          ? null
          : (pendingIntentProductId ?? this.pendingIntentProductId),
      pendingLinkPurchases: pendingLinkPurchases ?? this.pendingLinkPurchases,
    );
  }

  ProductDetails? productFor(String id) {
    final matches = products.where((p) => p.id == id).toList();
    if (matches.isEmpty) return null;
    if (matches.length == 1) return matches.first;

    // Audit H3 fix: a Google Play subscription with more than one active
    // offer (e.g. a promotional free-trial/intro-price offer alongside the
    // plain base plan) makes queryProductDetails() return ONE
    // GooglePlayProductDetails entry PER offer, all sharing this same
    // product id — `firstWhere` previously just took whichever happened to
    // come first in Google's response order, which is undocumented and not
    // guaranteed to be the plain base plan. This app has no UI to explain a
    // multi-phase promotional price (it only ever shows one flat recurring
    // price per plan, see AppConstants.monthlyPrice etc.), so deliberately
    // prefer the base offer — identified by `offerId == null`, Play
    // Billing's convention for "the base plan's own price, no special
    // time-limited discount" — over any promotional one. Non-Android /
    // non-subscription entries have no `subscriptionIndex` and are matched
    // as-is since there's nothing to disambiguate for them.
    for (final p in matches) {
      if (p is! GooglePlayProductDetails) continue;
      final idx = p.subscriptionIndex;
      if (idx == null) continue;
      final offers = p.productDetails.subscriptionOfferDetails;
      if (offers != null && idx < offers.length && offers[idx].offerId == null) {
        return p;
      }
    }
    return matches.first;
  }

  /// Resolves a plan's product by trying every candidate ID for it (current
  /// + legacy naming) — see [AppConstants.iapProductIdCandidates].
  ProductDetails? productForPlan(String canonicalId) {
    final candidates = AppConstants.iapProductIdCandidates[canonicalId] ?? [canonicalId];
    for (final id in candidates) {
      final match = productFor(id);
      if (match != null) return match;
    }
    return null;
  }

  /// Number of public paywall plans that resolved to a real store product,
  /// counting either the current or legacy ID as a match. Family SKUs are
  /// still queried for restore but do not count toward "plans loaded".
  int get loadedPlanCount => AppConstants.iapPublicPlanIds
      .where((id) => productForPlan(id) != null)
      .length;

  bool get hasPendingLink => pendingLinkPurchases.isNotEmpty;

  bool get needsProductReload =>
      isAvailable &&
      status != IAPStatus.loading &&
      loadedPlanCount < AppConstants.iapPlanCount;

  // These 3 branches used to return internal setup/troubleshooting
  // instructions verbatim to the SnackBar shown when a real customer taps
  // Buy ("Create all 4 products in App Store Connect / Play Console, set
  // them Active/Ready to Submit…", "Missing product IDs in App Store
  // Connect / Play Console — they must match exactly and be Active.") — a
  // paying customer (or an App Review tester) has no App Store Connect/Play
  // Console access and can't act on any of that; it just reads as broken,
  // unprofessional debug output. The actual diagnostic detail is still
  // logged via debugPrint for us to see in device logs / TestFlight
  // crash-adjacent logging, just no longer surfaced in the UI.
  String unavailableProductMessage() {
    if (!isAvailable) {
      debugPrint(
        '[IAP] unavailableProductMessage: billing unavailable on this install '
        '(sideloaded/debug build, or store billing API unreachable)',
      );
      return 'Store billing is unavailable on this device right now. Please try again, '
          'or contact support@themuslimman.com if this continues.';
    }
    if (products.isEmpty) {
      debugPrint(
        '[IAP] unavailableProductMessage: 0 of ${AppConstants.iapPlanCount} plans loaded from the store',
      );
      return 'We could not load plans from the store. Please check your connection and tap Retry, '
          'or contact support@themuslimman.com if this continues.';
    }
    if (notFoundIds.isNotEmpty) {
      debugPrint(
        '[IAP] unavailableProductMessage: only $loadedPlanCount of ${AppConstants.iapPlanCount} '
        'plans loaded; missing productIds=$notFoundIds',
      );
      return 'This plan is temporarily unavailable. Please tap Retry, '
          'or contact support@themuslimman.com if this continues.';
    }
    return 'This plan could not be loaded from the store. Tap Retry.';
  }

  String get storeStatusLabel {
    if (status == IAPStatus.loading) return 'Loading plans from the store…';
    if (!isAvailable) return 'Store billing unavailable';
    return '$loadedPlanCount of ${AppConstants.iapPlanCount} plans loaded from the store';
  }
}

/// Best-effort stable identity for a [PurchaseDetails] — used only to
/// de-duplicate/remove entries in [IAPState.pendingLinkPurchases], never sent
/// to the backend (verification there keys on the receipt/token itself).
/// `purchaseID` is the OS-assigned transaction id and is present for every
/// real purchase event; the receipt data is a fallback for the rare case a
/// plugin surfaces a purchase without one.
String _purchaseKey(PurchaseDetails p) =>
    p.purchaseID ?? p.verificationData.serverVerificationData;

// ─────────────────────────────────────────────────────────────────────────────
// Notifier
// ─────────────────────────────────────────────────────────────────────────────

class IAPNotifier extends StateNotifier<IAPState> {
  final Ref _ref;
  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _purchaseSub;

  bool _restoreReceivedEvents = false;
  Timer? _restoreTimer;

  bool _purchaseReceivedEvent = false;
  Timer? _purchaseTimer;
  // Serializes overlapping purchaseStream deliveries so two concurrent
  // _handlePurchaseUpdates batches can't interleave state / double-finalize
  // (Audit A6).
  Future<void> _purchaseUpdatesChain = Future.value();
  // Audit H4 fix: this used to be 15 seconds — enough for the narrow
  // "already-owned item, Play never shows any UI or emits any event at all"
  // edge case this timer exists to catch (see doc comment on buy() below),
  // but the SAME timer also covers the ordinary purchase flow, where the
  // user is actively interacting with the real Play billing sheet (picking
  // or adding a payment method, confirming with device unlock/biometrics,
  // etc.) — all of which can easily take longer than 15 seconds and does
  // NOT background the Flutter app (the sheet is an in-app overlay, not a
  // separate Activity) or otherwise signal "the user is still busy" to this
  // timer. Firing early falsely told a user still mid-purchase that
  // something went wrong ("may already be linked... tap Restore"), which
  // could easily prompt them to back out and re-tap Buy — starting a SECOND
  // concurrent purchase flow for the same product while the first one was
  // still legitimately in progress.
  static const _kPurchaseTimeout = Duration(seconds: 90);
  /// The product id the currently-pending buy() call is waiting on. The
  /// purchase-stream fallback timer must only be cancelled by an event for
  /// THIS product — otherwise an unrelated event arriving in the same 15s
  /// window (e.g. a background subscription-renewal replay, or a stray
  /// restore event) silently defeats the exact "no stream event ever
  /// arrives" case this timer exists to catch.
  String? _pendingBuyProductId;

  // Re-entrancy guards: the OS purchase sheet, resolveProductForPlan(), and
  // ensureSession() all involve awaits before state.status ever flips to
  // `purchasing`. Without these, a fast double-tap (or two separate buy
  // buttons in the same build) could fire buyNonConsumable() twice for the
  // same product, leading to duplicate StoreKit/Play sheets or races.
  bool _buyInFlight = false;
  bool _restoreInFlight = false;

  IAPNotifier(this._ref) : super(const IAPState()) {
    _init();
  }

  Future<void> _init() async {
    // Attach purchase stream before anything else — OS may deliver pending
    // purchases (e.g. subscription renewals, unacknowledged prior purchases)
    // as soon as the billing client connects.
    _purchaseSub = _iap.purchaseStream.listen(
      (purchases) {
        _purchaseUpdatesChain = _purchaseUpdatesChain
            .then((_) => _handlePurchaseUpdates(purchases))
            .catchError((Object e, StackTrace st) {
          debugPrint('[IAP] purchaseStream handler error: $e\n$st');
        });
      },
      onError: (err) => debugPrint('[IAP] stream error: $err'),
    );

    // Watch auth state. When the user logs in:
    //   1. Auto-execute any stored purchase intent (plan they tapped before auth).
    //   2. Auto-verify any legacy unlinked purchase.
    _ref.listen<AuthState>(authProvider, (prev, next) {
      if (prev != null && !prev.isLoggedIn && next.isLoggedIn) {
        _onUserLoggedIn();
      }
    });

    final available = await _iap.isAvailable();
    if (!available) {
      state = IAPState(
        status: IAPStatus.idle,
        isAvailable: false,
        errorMessage: 'In-app purchases are not available on this device.',
      );
      return;
    }

    await _loadProducts();
  }

  // ── Product loading ─────────────────────────────────────────────────────────

  Future<void> _loadProducts() async {
    state = state.copyWith(status: IAPStatus.loading, isAvailable: true);
    try {
      final response = await _iap.queryProductDetails(AppConstants.iapProductIds);
      if (response.error != null) {
        debugPrint('[IAP] queryProductDetails error: ${response.error}');
      }
      if (response.notFoundIDs.isNotEmpty) {
        debugPrint('[IAP] products not found in store: ${response.notFoundIDs}');
      }
      state = state.copyWith(
        status: IAPStatus.idle,
        products: response.productDetails,
        notFoundIds: response.notFoundIDs,
        isAvailable: true,
      );
    } catch (e) {
      debugPrint('[IAP] _loadProducts error: $e');
      state = state.copyWith(
        status: IAPStatus.idle,
        isAvailable: true,
        errorMessage: 'Failed to load products from the store.',
      );
    }
  }

  Future<void> reloadProducts() async {
    state = state.copyWith(status: IAPStatus.loading, errorMessage: null);
    await _loadProducts();
  }

  Future<ProductDetails?> resolveProduct(String id) async {
    final existing = state.productFor(id);
    if (existing != null) return existing;
    if (!state.isAvailable) return null;
    await reloadProducts();
    return state.productFor(id);
  }

  /// Like [resolveProduct] but tries every candidate ID for a plan (current
  /// + legacy naming) — use this from purchase screens instead of
  /// [resolveProduct] directly.
  Future<ProductDetails?> resolveProductForPlan(String canonicalId) async {
    final existing = state.productForPlan(canonicalId);
    if (existing != null) return existing;
    if (!state.isAvailable) return null;
    await reloadProducts();
    return state.productForPlan(canonicalId);
  }

  // ── Purchase intent (pre-auth) ──────────────────────────────────────────────

  /// Store the product the user wants to buy before they are authenticated.
  /// After successful login, [_onUserLoggedIn] auto-executes this intent.
  void setPurchaseIntent(String productId) {
    state = state.copyWith(pendingIntentProductId: productId);
  }

  void clearPurchaseIntent() {
    state = state.copyWith(clearPendingIntent: true);
  }

  // ── Post-login auto-actions ─────────────────────────────────────────────────

  Future<void> _onUserLoggedIn() async {
    if (!mounted) return;

    // First: verify every unlinked purchase that arrived before auth
    // (legacy/edge) — sequentially, so each gets its own turn through
    // _verifyAndLinkPurchase's error handling instead of one failure
    // aborting the rest of the queue.
    if (state.pendingLinkPurchases.isNotEmpty) {
      for (final linkPurchase in List<PurchaseDetails>.from(state.pendingLinkPurchases)) {
        if (!mounted) return;
        await _verifyAndLinkPurchase(linkPurchase);
      }
      return; // don't also auto-buy — one action at a time
    }

    // Then: execute the purchase intent the user had before logging in.
    final intentId = state.pendingIntentProductId;
    if (intentId != null) {
      state = state.copyWith(clearPendingIntent: true);
      final product = await resolveProduct(intentId);
      if (product != null && mounted) {
        await buy(product);
      }
    }
  }

  /// Explicitly claim every pending OS purchase using a guest session if
  /// needed. Each purchase is verified sequentially so one failure doesn't
  /// prevent the others (still queued afterward) from being claimed.
  Future<void> claimPendingPurchase() async {
    if (state.pendingLinkPurchases.isEmpty) return;
    final ready = await _ref.read(authProvider.notifier).ensureSession();
    if (!ready || !_ref.read(authProvider).isLoggedIn) {
      state = state.copyWith(
        status: IAPStatus.error,
        errorMessage: _ref.read(authProvider).error ??
            'Could not claim purchase. Please try again.',
      );
      return;
    }
    for (final purchase in List<PurchaseDetails>.from(state.pendingLinkPurchases)) {
      if (!mounted) return;
      await _verifyAndLinkPurchase(purchase);
    }
  }

  // ── Buying ──────────────────────────────────────────────────────────────────

  /// Google Play's `setObfuscatedAccountId` (surfaced by the plugin as
  /// `applicationUserName`) explicitly must NOT contain directly-identifying
  /// information — UserModel has no stable server-issued user id (only
  /// email/name), so hash the email instead of sending it raw. Returns null
  /// for anonymous/guest accounts (no email to hash) or if somehow called
  /// while logged out — Google Play Billing treats a null/omitted value as
  /// "not provided", which is the existing (pre-fix) behavior, so this never
  /// makes the purchase flow itself any less permissive.
  String? _obfuscatedAccountId() {
    final email = _ref.read(authProvider).user?.email;
    if (email == null || email.isEmpty) return null;
    return sha256.convert(utf8.encode(email.trim().toLowerCase())).toString();
  }

  /// Initiate a purchase. Caller MUST ensure the user is logged in before
  /// calling. Returns `false` (without touching shared IAP state — doing so
  /// would incorrectly clobber the UI of whichever purchase IS proceeding)
  /// if another purchase is already in flight, so the calling screen can
  /// show its own local "a purchase is already in progress" message instead
  /// of just silently no-oping. Returns `true` once the purchase has been
  /// handed to the OS (result still arrives asynchronously as before).
  Future<bool> buy(ProductDetails product) async {
    if (!state.isAvailable) return false;
    if (_buyInFlight ||
        state.status == IAPStatus.purchasing ||
        state.status == IAPStatus.verifying) {
      debugPrint('[IAP] buy() ignored — a purchase is already in flight');
      return false;
    }
    // Require a real session cookie, not prefs-only "logged in" (cold-start
    // phantom after a failed secure-storage write). ensureSession clears
    // phantoms and provisions a guest when needed.
    if (!_ref.read(authProvider).isLoggedIn || !cookies.hasSessionCookie()) {
      debugPrint('[IAP] buy() missing session — ensuring before Play sheet');
      final ready = await _ref.read(authProvider.notifier).ensureSession();
      if (!ready || !_ref.read(authProvider).isLoggedIn || !cookies.hasSessionCookie()) {
        debugPrint('[IAP] buy() refused — no session cookie');
        state = state.copyWith(
          status: IAPStatus.error,
          errorMessage: 'Could not start checkout. Please try again.',
        );
        return false;
      }
    }
    _buyInFlight = true;
    state = state.copyWith(status: IAPStatus.purchasing, errorMessage: null);
    try {
      final PurchaseParam param;
      if (!kIsWeb && Platform.isAndroid && product is GooglePlayProductDetails) {
        // Subscriptions require the base-plan offer token on Google Play Billing 5+.
        param = GooglePlayPurchaseParam(
          productDetails: product,
          offerToken: product.offerToken,
          // Play Console fraud/anomaly detection can't tie a purchase to an
          // account without this — this codebase's backend already does its
          // own account linkage via session-verified receipt checking
          // (/api/mobile-purchases/verify), so this is defense-in-depth, not
          // load-bearing. Google explicitly warns against passing raw PII
          // (e.g. email) here, so hash it — UserModel has no stable
          // server-issued id to use instead (see comment below).
          applicationUserName: _obfuscatedAccountId(),
        );
      } else {
        param = PurchaseParam(productDetails: product);
      }

      // Guard against a plugin/platform edge case where buying an
      // already-owned item (e.g. re-tapping a plan just purchased on this
      // account) never emits a purchaseStream event at all — leaving the UI
      // stuck on a spinner forever with no way out. If nothing arrives in
      // time, fall back to restorePurchases(), which reliably surfaces
      // already-owned entitlements.
      _purchaseReceivedEvent = false;
      _pendingBuyProductId = product.id;
      _purchaseTimer?.cancel();
      _purchaseTimer = Timer(_kPurchaseTimeout, () {
        if (!mounted) return;
        if (state.status == IAPStatus.purchasing && !_purchaseReceivedEvent) {
          debugPrint('[IAP] buy() timed out with no stream event — falling back to restore');
          // Keep `_buyInFlight` and `_pendingBuyProductId` true so (a) a
          // second buy() can't start while the Play sheet may still be open
          // completing payment, and (b) the eventual stream event still
          // matches the pending buy. Only leave `purchasing` so
          // restorePurchases() isn't blocked by its status guard.
          state = state.copyWith(status: IAPStatus.idle, errorMessage: null);
          unawaited(restorePurchases());
        }
      });

      await _iap.buyNonConsumable(purchaseParam: param);
      // Result normally arrives via _handlePurchaseUpdates; the timer above
      // covers the case where it never does. _buyInFlight is cleared there
      // and in _handlePurchaseUpdates once a terminal status is reached.
      return true;
    } catch (e) {
      debugPrint('[IAP] buy() threw: $e');
      _buyInFlight = false;
      _pendingBuyProductId = null;
      _purchaseTimer?.cancel();
      state = state.copyWith(
        status: IAPStatus.error,
        errorMessage: 'Could not start the purchase. Please try again.',
      );
      return false;
    }
  }

  // ── Restore ─────────────────────────────────────────────────────────────────

  /// Restore previous purchases. Caller MUST ensure the user is logged in.
  static const _kRestoreTimeout = Duration(seconds: 10);

  Future<void> restorePurchases() async {
    if (!state.isAvailable) return;
    if (_restoreInFlight ||
        state.status == IAPStatus.purchasing ||
        state.status == IAPStatus.verifying) {
      debugPrint('[IAP] restorePurchases() ignored — already in flight');
      return;
    }
    assert(
      _ref.read(authProvider).isLoggedIn,
      'restorePurchases() must only be called when the user is authenticated',
    );
    if (!_ref.read(authProvider).isLoggedIn || !cookies.hasSessionCookie()) {
      state = state.copyWith(
        status: IAPStatus.error,
        errorMessage: 'Could not restore purchases. Please try again.',
      );
      return;
    }
    _restoreInFlight = true;
    _restoreReceivedEvents = false;
    _restoreTimer?.cancel();
    // Armed BEFORE calling _iap.restorePurchases() rather than after it
    // resolves: on iOS in particular, that future's completion is driven by
    // SKPaymentQueue's "restore finished" delegate callback, which typically
    // fires only AFTER every restored transaction has already been delivered
    // through the purchaseStream — i.e. _handlePurchaseUpdates can (and
    // often does) run to completion DURING this await. Arming the timer only
    // after the await previously meant that window had no live timer for a
    // fast `restored` event to cancel, relying entirely on the
    // _restoreReceivedEvents flag persisting correctly instead.
    _restoreTimer = Timer(_kRestoreTimeout, () {
      if (!mounted) return;
      if (!_restoreInFlight) return;
      _restoreInFlight = false;
      if (state.status == IAPStatus.purchasing && !_restoreReceivedEvents) {
        state = state.copyWith(status: IAPStatus.restoreEmpty);
      }
    });
    state = state.copyWith(status: IAPStatus.purchasing, errorMessage: null);
    try {
      await _iap.restorePurchases();
      // Audit A5: if the OS finished restore with zero events, don't leave
      // status stuck on `purchasing` for the full 10s timer — a short grace
      // covers late stream deliveries that race the restore-finished
      // callback, then clear to restoreEmpty so Buy/Restore aren't blocked.
      await Future<void>.delayed(const Duration(milliseconds: 600));
      if (mounted &&
          _restoreInFlight &&
          !_restoreReceivedEvents &&
          state.status == IAPStatus.purchasing) {
        _restoreTimer?.cancel();
        _restoreInFlight = false;
        state = state.copyWith(status: IAPStatus.restoreEmpty);
      }
    } catch (e) {
      debugPrint('[IAP] restorePurchases() threw: $e');
      _restoreInFlight = false;
      _restoreTimer?.cancel();
      state = state.copyWith(
        status: IAPStatus.error,
        errorMessage: 'Could not restore purchases. Please try again.',
      );
      return;
    }
  }

  // ── Purchase stream handler ─────────────────────────────────────────────────

  Future<void> _handlePurchaseUpdates(List<PurchaseDetails> purchases) async {
    for (final purchase in purchases) {
      // True when this event is for the exact product a foreground buy()
      // call is actively awaiting — as opposed to an unrelated event (a
      // different product's subscription-renewal replay from the OS queue,
      // which is delivered as a plain `purchased` status just like a fresh
      // buy) arriving in the background while that buy() is still pending.
      final targetsPendingBuy =
          _pendingBuyProductId != null && purchase.productID == _pendingBuyProductId;
      // Only defuse the buy() timeout fallback for the product it's actually
      // waiting on — an unrelated event must not silently cancel it.
      if (_pendingBuyProductId == null || targetsPendingBuy) {
        _purchaseReceivedEvent = true;
        _purchaseTimer?.cancel();
      }
      switch (purchase.status) {
        case PurchaseStatus.pending:
          // Don't flip the UI to "purchasing" for an unrelated product while
          // the user is actively watching a different pending buy.
          if (_pendingBuyProductId == null || targetsPendingBuy) {
            state = state.copyWith(status: IAPStatus.purchasing);
          }

        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          // Android Play Billing delivers restore results as `purchased`, not
          // `restored` (iOS uses `restored`). Treat any purchased event that
          // arrives while restore is in flight — and isn't the foreground
          // buy's product — as a restore event so `_restoreReceivedEvents`
          // flips and we don't falsely show restoreEmpty / leave
          // `_restoreInFlight` stuck for the full timeout.
          final isRestoreEvent = purchase.status == PurchaseStatus.restored ||
              (_restoreInFlight && !targetsPendingBuy);
          // A restore event (there's only ever one restore flow, so it's
          // never "unrelated"), or a purchased event matching the buy the
          // current screen is actively watching, drives the visible
          // IAPState. Any OTHER purchased event — the renewal-replay case
          // above — must still be verified/finalized below so access is
          // correctly granted/refreshed, but must not steal the pending
          // buy's guard or clobber its purchasing/verifying UI state.
          final affectsUiState = isRestoreEvent || targetsPendingBuy || _pendingBuyProductId == null;
          if (isRestoreEvent) {
            _restoreReceivedEvents = true;
            _restoreTimer?.cancel();
            _restoreInFlight = false;
          } else if (targetsPendingBuy || _pendingBuyProductId == null) {
            _buyInFlight = false;
            _pendingBuyProductId = null;
          }
          await _completePurchase(purchase, affectsUiState: affectsUiState);

        case PurchaseStatus.error:
          // The plugin doesn't tag which in-flight operation (buy vs.
          // restore) an error belongs to, so fall back to product-id
          // matching for buy and "only a restore is active" for restore —
          // this correctly handles the common case (one op at a time) and
          // is no worse than the previous blanket-clear for the rare case
          // of both being simultaneously in flight.
          final restoreOnlyActive = _restoreInFlight && !_buyInFlight;
          final affectsUiState =
              targetsPendingBuy || restoreOnlyActive || (!_buyInFlight && !_restoreInFlight);
          if (targetsPendingBuy || _pendingBuyProductId == null) {
            _buyInFlight = false;
            _pendingBuyProductId = null;
          }
          if (restoreOnlyActive || !_buyInFlight) {
            // Without cancelling the timer here too (previously only done on
            // the `restored` branch below), a restore that concludes via an
            // error event — never receiving an actual `restored` event, so
            // _restoreReceivedEvents stays false — left its 10s _kRestoreTimeout
            // timer running. If the user started a NEW buy() within that
            // window, its state also becomes IAPStatus.purchasing (the same
            // shared enum value restore uses), and the stale timer would then
            // fire, see `status == purchasing && !_restoreReceivedEvents`, and
            // incorrectly clobber the unrelated in-flight buy with
            // IAPStatus.restoreEmpty.
            _restoreInFlight = false;
            _restoreReceivedEvents = true;
            _restoreTimer?.cancel();
          }
          if (affectsUiState) {
            state = state.copyWith(
              status: IAPStatus.error,
              errorMessage: purchase.error?.message ?? 'Purchase failed. Please try again.',
            );
          }
          await _finalize(purchase);

        case PurchaseStatus.canceled:
          final restoreOnlyActive = _restoreInFlight && !_buyInFlight;
          final affectsUiState =
              targetsPendingBuy || restoreOnlyActive || (!_buyInFlight && !_restoreInFlight);
          if (targetsPendingBuy || _pendingBuyProductId == null) {
            _buyInFlight = false;
            _pendingBuyProductId = null;
          }
          if (restoreOnlyActive || !_buyInFlight) {
            // See matching comment in the `error` branch above — same stale-
            // timer race applies to a cancelled restore.
            _restoreInFlight = false;
            _restoreReceivedEvents = true;
            _restoreTimer?.cancel();
          }
          if (affectsUiState) {
            state = state.copyWith(status: IAPStatus.cancelled);
          }
          await _finalize(purchase);
      }
    }
  }

  /// [affectsUiState] is false when this purchase event is an unrelated
  /// background event (e.g. a different product's subscription-renewal
  /// replay) arriving while the current screen is actively watching a
  /// different, still-pending buy() — access is still correctly
  /// verified/granted/finalized below, but the shared [IAPState.status]
  /// that screen is keyed off of is left untouched.
  Future<void> _completePurchase(PurchaseDetails purchase, {bool affectsUiState = true}) async {
    // Renewal transactions for an existing subscription are replayed by the
    // OS payment queue as soon as the observer attaches — which happens at
    // app startup, in parallel with AuthNotifier's own async restore of the
    // signed-in session from disk (see AuthNotifier._restore). Without this
    // wait, a renewal that arrives before _restore() finishes would read the
    // default `isLoggedIn: false` state and silently spin up a brand-new
    // guest account for it, splitting the subscription off the real
    // (already signed-in) user's account instead of re-verifying against it.
    await _waitForAuthRestore();
    var isLoggedIn = _ref.read(authProvider).isLoggedIn && cookies.hasSessionCookie();

    if (!isLoggedIn) {
      // OS delivered a purchase without a session. Silently create a guest
      // session (Apple 5.1.1(v)) instead of forcing email/password login.
      debugPrint('[IAP] purchase arrived without auth — ensuring guest session');
      final ready = await _ref.read(authProvider.notifier).ensureSession();
      isLoggedIn = ready &&
          _ref.read(authProvider).isLoggedIn &&
          cookies.hasSessionCookie();
      if (!isLoggedIn) {
        debugPrint('[IAP] guest session failed — storing for recovery');
        // Audit M-dropped-purchase: this must run unconditionally, even when
        // `affectsUiState` is false. Previously the queue write itself was
        // gated behind `if (affectsUiState)`, so an unrelated BACKGROUND
        // purchase event (e.g. a renewal replay for a different product
        // arriving while the current screen is watching its own foreground
        // buy()) that failed to obtain a session was dropped completely —
        // never verified, never finalized, and never even added to the
        // recovery queue for the user to claim later. Only the `status`
        // flip below (which WOULD steal the foreground screen's UI) stays
        // conditional.
        if (!state.pendingLinkPurchases.any((p) => _purchaseKey(p) == _purchaseKey(purchase))) {
          state = state.copyWith(
            pendingLinkPurchases: [...state.pendingLinkPurchases, purchase],
          );
        }
        if (affectsUiState) {
          state = state.copyWith(status: IAPStatus.pendingLink);
        }
        return;
      }
    }

    if (affectsUiState) {
      state = state.copyWith(status: IAPStatus.verifying, clearPendingIntent: true);
    }
    try {
      await _verifyWithBackend(purchase, affectsUiState: affectsUiState);
    } catch (e) {
      debugPrint('[IAP] backend verification error: $e');
      // iOS: finalize to clear from StoreKit queue (user can retry via Restore).
      // Android: do NOT finalize — auto-refund is the safer default.
      final isIOS = !kIsWeb && Platform.isIOS;
      if (affectsUiState) {
        state = state.copyWith(
          status: IAPStatus.error,
          errorMessage: _verificationErrorMessage(
            e,
            // Once finalized on iOS, the transaction leaves the local queue —
            // the ONLY way back is Restore Purchases, so every iOS fallback
            // message must say so explicitly.
            fallback: isIOS
                ? 'Purchase verification failed. Tap Restore Purchases to try '
                    'again, or contact support@themuslimman.com.'
                : 'Purchase verification failed. Please try again or contact support@themuslimman.com',
          ),
        );
      }
      if (isIOS) {
        await _finalize(purchase);
      }
      return;
    }
    // Verification succeeded — _verifyWithBackend already committed
    // `state.status = IAPStatus.success` (if affectsUiState). Finalize
    // (acknowledge, on Android; clear the StoreKit queue, on iOS) in its own
    // try/catch: a failure here (e.g. a redelivered stream event double-
    // completing the same purchase) must never regress the UI back to an
    // error for a purchase that was genuinely verified and already granted
    // server-side.
    try {
      await _finalize(purchase);
    } catch (e) {
      debugPrint('[IAP] finalize after successful verification failed (access already granted): $e');
    }
  }

  /// Waits (briefly) for [AuthNotifier._restore] to finish loading the
  /// cached session from disk, so purchase-stream events that fire at cold
  /// launch see the real signed-in state instead of the notifier's default
  /// `isLoading: true / isLoggedIn: false` placeholder. Polls rather than
  /// using `ref.listen` (which is only safe to register during a provider's
  /// initial build) and is bounded so a stuck restore can never hang a
  /// purchase indefinitely.
  Future<void> _waitForAuthRestore() async {
    const step = Duration(milliseconds: 50);
    const maxWait = Duration(seconds: 5);
    var waited = Duration.zero;
    while (_ref.read(authProvider).isLoading && waited < maxWait) {
      await Future.delayed(step);
      waited += step;
    }
  }

  /// Verify a legacy unlinked purchase after the user has signed in. Only
  /// removes THIS purchase from [IAPState.pendingLinkPurchases] on success —
  /// any other still-unclaimed purchases in the queue are left untouched so
  /// a caller iterating the whole queue (see [_onUserLoggedIn],
  /// [claimPendingPurchase]) can keep processing the rest even if this one
  /// fails.
  Future<void> _verifyAndLinkPurchase(PurchaseDetails purchase) async {
    if (!mounted) return;
    await _waitForAuthRestore();
    state = state.copyWith(status: IAPStatus.verifying);
    try {
      await _verifyWithBackend(purchase);
      await _finalize(purchase);
      state = state.copyWith(
        pendingLinkPurchases: state.pendingLinkPurchases
            .where((p) => _purchaseKey(p) != _purchaseKey(purchase))
            .toList(),
      );
    } catch (e) {
      debugPrint('[IAP] pending link verify error: $e');
      final isIOS = !kIsWeb && Platform.isIOS;
      state = state.copyWith(
        status: IAPStatus.error,
        errorMessage: _verificationErrorMessage(
          e,
          fallback: isIOS
              ? 'Could not verify your purchase. Tap Restore Purchases to try '
                  'again, or contact support@themuslimman.com'
              : 'Could not verify your purchase. Please contact support@themuslimman.com',
        ),
      );
      if (isIOS) {
        await _finalize(purchase);
      }
    }
  }

  /// Prefer the backend's `error` field over Dio's verbose exception dump.
  String _verificationErrorMessage(
    Object e, {
    String fallback =
        'Purchase verification failed. Please try again or contact support@themuslimman.com',
  }) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map) {
        final msg = data['error'];
        if (msg is String && msg.trim().isNotEmpty) return msg;
      }
      final code = e.response?.statusCode;
      if (code == 401) {
        return 'Your session expired. Please close and reopen the app, then try Restore Purchases.';
      }
      if (code == 409) {
        return 'This purchase is already linked to an account. If you previously created an '
            'account (email/password), please Sign In to restore it — otherwise contact '
            'support@themuslimman.com if you need help.';
      }
      if (code == 422 || code == 502) {
        return 'We could not verify this purchase with the store. Please try Restore Purchases, or contact support@themuslimman.com.';
      }
      return fallback;
    }
    if (e is Exception) {
      final text = e.toString().replaceFirst('Exception: ', '').trim();
      // Never surface raw DioException dumps if they slipped through.
      if (text.startsWith('DioException')) return fallback;
      if (text.isNotEmpty) return text;
    }
    return fallback;
  }

  // ── Backend verification ────────────────────────────────────────────────────

  Future<void> _verifyWithBackend(PurchaseDetails purchase, {bool affectsUiState = true}) async {
    final productId = purchase.productID;
    final serverData = purchase.verificationData.serverVerificationData;

    final Map<String, dynamic> body;
    if (!kIsWeb && Platform.isIOS) {
      body = {
        'platform': 'apple',
        'productId': productId,
        'receiptData': serverData,
      };
    } else {
      body = {
        'platform': 'google',
        'productId': productId,
        'purchaseToken': serverData,
        'orderId': purchase.purchaseID ?? '',
      };
    }

    // Retry transient failures (network hiccups / 5xx) before giving up.
    // This matters most on iOS, where a failed verify still finalizes the
    // StoreKit transaction (to keep the queue from jamming) — so reducing
    // spurious failures here reduces how often a paying user ever needs to
    // fall back to "Restore Purchases" at all.
    const maxAttempts = 3;
    DioException? lastError;
    for (var attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        final response = await ApiClient.instance.dio.post(
          '/api/mobile-purchases/verify',
          data: body,
        );
        final data = response.data as Map<String, dynamic>;

        if (data['success'] != true) {
          throw Exception(data['error'] ?? 'Verification failed');
        }

        final hasAccess = data['hasAccess'] as bool? ?? false;
        if (!hasAccess) {
          throw Exception(
            'Purchase was recorded but access could not be confirmed. '
            'Please contact support@themuslimman.com',
          );
        }

        // Apply hasAccess/isFamily directly from THIS response — don't rely
        // solely on the second round-trip inside refreshAccessAfterPurchase(),
        // whose underlying _verifySession() deliberately swallows non-401/403
        // errors. Without this, a timeout on that second call left the local
        // AuthState stale (still locked) even though this verify call had
        // already succeeded and granted access server-side.
        _ref.read(authProvider.notifier).applyAccessUpdate(
              hasAccess: hasAccess,
              isFamily: data['isFamily'] as bool?,
              // This verify call only ever runs for a purchase made through
              // THIS device's native store, so the platform is known
              // immediately without waiting on the best-effort refresh
              // below — lets "Manage Subscription" route correctly right
              // after purchase, not just after the next app resume.
              purchasePlatform: Platform.isIOS ? 'apple' : 'google',
              // Audit H6 fix: the server may have just auto-verified this
              // account's email as a side effect of granting access (see
              // /api/mobile-purchases/verify's matching comment) — apply it
              // immediately so a "verify your email" prompt doesn't flash up
              // for a purchase that was just fully paid for.
              emailVerified: data['emailVerified'] as bool?,
            );
        // Best-effort extra refresh (re-derives from /api/access/check) — no
        // longer load-bearing for this purchase's success state above.
        unawaited(_ref.read(authProvider.notifier).refreshAccessAfterPurchase());
        // Drop any pre-purchase profile cache (limit 1) so Profiles shows the
        // family slots right away.
        _ref.invalidate(profilesProvider);

        if (affectsUiState) {
          state = state.copyWith(
            status: IAPStatus.success,
            successProductId: productId,
          );
        }
        return;
      } on DioException catch (e) {
        lastError = e;
        final status = e.response?.statusCode;
        // Only retry genuinely transient failures — never retry a definitive
        // rejection (401/409/422 etc.). A 5xx caused by missing/invalid
        // server config (APPLE_IAP_SHARED_SECRET / GOOGLE_SERVICE_ACCOUNT_KEY)
        // is permanent, not transient — retrying it 3x just triples load on
        // our backend and on Apple/Google during exactly the kind of outage
        // where that matters most. The server marks these `retryable: false`.
        final retryableFlag = (e.response?.data is Map)
            ? (e.response!.data as Map)['retryable'] as bool?
            : null;
        final status5xx = status == null || status >= 500;
        final isTransient = status5xx && retryableFlag != false;
        if (!isTransient || attempt == maxAttempts) rethrow;
        debugPrint('[IAP] verify attempt $attempt failed ($status) — retrying');
        await Future.delayed(Duration(milliseconds: 600 * attempt));
      }
    }
    // Unreachable, but keeps the analyzer happy about all paths returning.
    if (lastError != null) throw lastError;
  }

  Future<void> _finalize(PurchaseDetails purchase) async {
    if (purchase.pendingCompletePurchase) {
      await _iap.completePurchase(purchase);
    }
  }

  // ── UI helpers ──────────────────────────────────────────────────────────────

  void clearError() {
    state = state.copyWith(status: IAPStatus.idle, errorMessage: null);
  }

  void clearSuccess() {
    state = state.copyWith(status: IAPStatus.idle, successProductId: null);
  }

  @override
  void dispose() {
    _restoreTimer?.cancel();
    _purchaseTimer?.cancel();
    _purchaseSub?.cancel();
    super.dispose();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

final iapProvider = StateNotifierProvider<IAPNotifier, IAPState>((ref) {
  return IAPNotifier(ref);
});
