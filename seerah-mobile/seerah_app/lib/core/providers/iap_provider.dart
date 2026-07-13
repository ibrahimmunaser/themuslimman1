import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:in_app_purchase_android/in_app_purchase_android.dart';

import '../constants/app_constants.dart';
import '../network/api_client.dart';
import 'auth_provider.dart';

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

  /// A purchase that arrived via the OS stream before the user was logged in.
  /// Shown as a recovery banner; verified automatically after sign-in.
  final PurchaseDetails? pendingLinkPurchase;

  const IAPState({
    this.status = IAPStatus.loading,
    this.isAvailable = false,
    this.products = const [],
    this.notFoundIds = const [],
    this.errorMessage,
    this.successProductId,
    this.pendingIntentProductId,
    this.pendingLinkPurchase,
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
    PurchaseDetails? pendingLinkPurchase,
    bool clearPendingLink = false,
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
      pendingLinkPurchase: clearPendingLink
          ? null
          : (pendingLinkPurchase ?? this.pendingLinkPurchase),
    );
  }

  ProductDetails? productFor(String id) {
    try {
      return products.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
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

  /// Number of the 4 plans that resolved to a real store product, counting
  /// either the current or legacy ID as a match.
  int get loadedPlanCount => AppConstants.iapProductIdCandidates.values
      .where((candidates) => candidates.any((id) => productFor(id) != null))
      .length;

  bool get hasPendingLink => pendingLinkPurchase != null;

  bool get needsProductReload =>
      isAvailable &&
      status != IAPStatus.loading &&
      loadedPlanCount < AppConstants.iapPlanCount;

  String unavailableProductMessage() {
    if (!isAvailable) {
      return 'Store billing is unavailable on this install. '
          'Install the app from TestFlight / Play Console internal testing — not via USB, IPA/APK, or a debug run.';
    }
    if (products.isEmpty) {
      return 'No plans loaded from the store (0 of ${AppConstants.iapPlanCount}). '
          'Create all 4 products in App Store Connect / Play Console, set them Active/Ready to Submit, '
          'then install from a TestFlight or Internal testing link.';
    }
    if (notFoundIds.isNotEmpty) {
      return 'Only $loadedPlanCount of ${AppConstants.iapPlanCount} plans loaded. '
          'Missing product IDs in App Store Connect / Play Console — they must match exactly and be Active.';
    }
    return 'This plan could not be loaded from the store. Tap Retry.';
  }

  String get storeStatusLabel {
    if (status == IAPStatus.loading) return 'Loading plans from the store…';
    if (!isAvailable) return 'Store billing unavailable';
    return '$loadedPlanCount of ${AppConstants.iapPlanCount} plans loaded from the store';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifier
// ─────────────────────────────────────────────────────────────────────────────

class IAPNotifier extends StateNotifier<IAPState> {
  final Ref _ref;
  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _purchaseSub;

  bool _restoreReceivedEvents = false;
  Timer? _restoreTimer;

  IAPNotifier(this._ref) : super(const IAPState()) {
    _init();
  }

  Future<void> _init() async {
    // Attach purchase stream before anything else — OS may deliver pending
    // purchases (e.g. subscription renewals, unacknowledged prior purchases)
    // as soon as the billing client connects.
    _purchaseSub = _iap.purchaseStream.listen(
      _handlePurchaseUpdates,
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

    // First: verify any unlinked purchase that arrived before auth (legacy/edge).
    final linkPurchase = state.pendingLinkPurchase;
    if (linkPurchase != null) {
      await _verifyAndLinkPurchase(linkPurchase);
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

  /// Explicitly claim a pending OS purchase using a guest session if needed.
  Future<void> claimPendingPurchase() async {
    final purchase = state.pendingLinkPurchase;
    if (purchase == null) return;
    final ready = await _ref.read(authProvider.notifier).ensureSession();
    if (!ready) {
      state = state.copyWith(
        status: IAPStatus.error,
        errorMessage: _ref.read(authProvider).error ??
            'Could not claim purchase. Please try again.',
      );
      return;
    }
    await _verifyAndLinkPurchase(purchase);
  }

  // ── Buying ──────────────────────────────────────────────────────────────────

  /// Initiate a purchase. Caller MUST ensure the user is logged in before calling.
  Future<void> buy(ProductDetails product) async {
    if (!state.isAvailable) return;
    assert(
      _ref.read(authProvider).isLoggedIn,
      'buy() must only be called when the user is authenticated',
    );
    state = state.copyWith(status: IAPStatus.purchasing, errorMessage: null);
    final PurchaseParam param;
    if (!kIsWeb && Platform.isAndroid && product is GooglePlayProductDetails) {
      // Subscriptions require the base-plan offer token on Google Play Billing 5+.
      param = GooglePlayPurchaseParam(
        productDetails: product,
        offerToken: product.offerToken,
      );
    } else {
      param = PurchaseParam(productDetails: product);
    }
    await _iap.buyNonConsumable(purchaseParam: param);
    // Result arrives via _handlePurchaseUpdates.
  }

  // ── Restore ─────────────────────────────────────────────────────────────────

  /// Restore previous purchases. Caller MUST ensure the user is logged in.
  static const _kRestoreTimeout = Duration(seconds: 10);

  Future<void> restorePurchases() async {
    if (!state.isAvailable) return;
    assert(
      _ref.read(authProvider).isLoggedIn,
      'restorePurchases() must only be called when the user is authenticated',
    );
    _restoreReceivedEvents = false;
    _restoreTimer?.cancel();
    state = state.copyWith(status: IAPStatus.purchasing, errorMessage: null);
    await _iap.restorePurchases();
    _restoreTimer = Timer(_kRestoreTimeout, () {
      if (!mounted) return;
      if (state.status == IAPStatus.purchasing && !_restoreReceivedEvents) {
        state = state.copyWith(status: IAPStatus.restoreEmpty);
      }
    });
  }

  // ── Purchase stream handler ─────────────────────────────────────────────────

  Future<void> _handlePurchaseUpdates(List<PurchaseDetails> purchases) async {
    for (final purchase in purchases) {
      switch (purchase.status) {
        case PurchaseStatus.pending:
          state = state.copyWith(status: IAPStatus.purchasing);

        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          if (purchase.status == PurchaseStatus.restored) {
            _restoreReceivedEvents = true;
            _restoreTimer?.cancel();
          }
          await _completePurchase(purchase);

        case PurchaseStatus.error:
          state = state.copyWith(
            status: IAPStatus.error,
            errorMessage: purchase.error?.message ?? 'Purchase failed. Please try again.',
          );
          await _finalize(purchase);

        case PurchaseStatus.canceled:
          state = state.copyWith(status: IAPStatus.cancelled);
          await _finalize(purchase);
      }
    }
  }

  Future<void> _completePurchase(PurchaseDetails purchase) async {
    var isLoggedIn = _ref.read(authProvider).isLoggedIn;

    if (!isLoggedIn) {
      // OS delivered a purchase without a session. Silently create a guest
      // session (Apple 5.1.1(v)) instead of forcing email/password login.
      debugPrint('[IAP] purchase arrived without auth — ensuring guest session');
      final ready = await _ref.read(authProvider.notifier).ensureSession();
      isLoggedIn = ready && _ref.read(authProvider).isLoggedIn;
      if (!isLoggedIn) {
        debugPrint('[IAP] guest session failed — storing for recovery');
        state = state.copyWith(
          status: IAPStatus.pendingLink,
          pendingLinkPurchase: purchase,
        );
        return;
      }
    }

    state = state.copyWith(status: IAPStatus.verifying, clearPendingIntent: true);
    try {
      await _verifyWithBackend(purchase);
      // Acknowledge only AFTER backend verification succeeds.
      // On Android, unacknowledged purchases are auto-refunded after 3 days.
      await _finalize(purchase);
    } catch (e) {
      debugPrint('[IAP] backend verification error: $e');
      final message = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Purchase verification failed. Please contact support if the issue persists.';
      state = state.copyWith(status: IAPStatus.error, errorMessage: message);
      // iOS: finalize to clear from StoreKit queue (user can retry via Restore).
      // Android: do NOT finalize — auto-refund is the safer default.
      if (!kIsWeb && Platform.isIOS) {
        await _finalize(purchase);
      }
    }
  }

  /// Verify a legacy unlinked purchase after the user has signed in.
  Future<void> _verifyAndLinkPurchase(PurchaseDetails purchase) async {
    if (!mounted) return;
    state = state.copyWith(status: IAPStatus.verifying);
    try {
      await _verifyWithBackend(purchase);
      await _finalize(purchase);
      state = state.copyWith(clearPendingLink: true);
    } catch (e) {
      debugPrint('[IAP] pending link verify error: $e');
      final message = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Could not verify your purchase. Please contact support@themuslimman.com';
      state = state.copyWith(status: IAPStatus.error, errorMessage: message);
      if (!kIsWeb && Platform.isIOS) {
        await _finalize(purchase);
      }
    }
  }

  // ── Backend verification ────────────────────────────────────────────────────

  Future<void> _verifyWithBackend(PurchaseDetails purchase) async {
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

    await _ref.read(authProvider.notifier).refreshAccessAfterPurchase();

    state = state.copyWith(
      status: IAPStatus.success,
      successProductId: productId,
    );
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
