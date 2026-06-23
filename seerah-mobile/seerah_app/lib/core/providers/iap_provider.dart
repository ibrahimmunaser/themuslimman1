import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

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
  /// Purchase completed but no account yet — waiting for account setup.
  pendingAccountSetup,
  error,
  cancelled,
  /// restorePurchases() completed with no prior purchases found.
  restoreEmpty,
}

class IAPState {
  final IAPStatus status;
  final bool isAvailable;
  final List<ProductDetails> products;
  final String? errorMessage;
  final String? successProductId;
  /// Stored when IAP succeeds before the user has an account.
  /// Used by AccountSetupScreen to verify after signup.
  final PurchaseDetails? pendingPurchase;

  const IAPState({
    this.status = IAPStatus.loading,
    this.isAvailable = false,
    this.products = const [],
    this.errorMessage,
    this.successProductId,
    this.pendingPurchase,
  });

  IAPState copyWith({
    IAPStatus? status,
    bool? isAvailable,
    List<ProductDetails>? products,
    String? errorMessage,
    String? successProductId,
    PurchaseDetails? pendingPurchase,
    bool clearPendingPurchase = false,
  }) {
    return IAPState(
      status: status ?? this.status,
      isAvailable: isAvailable ?? this.isAvailable,
      products: products ?? this.products,
      errorMessage: errorMessage,
      successProductId: successProductId ?? this.successProductId,
      pendingPurchase: clearPendingPurchase ? null : (pendingPurchase ?? this.pendingPurchase),
    );
  }

  ProductDetails? productFor(String id) {
    try {
      return products.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifier
// ─────────────────────────────────────────────────────────────────────────────

class IAPNotifier extends StateNotifier<IAPState> {
  final Ref _ref;
  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _purchaseSub;

  /// Tracks whether any restored events arrived during a restorePurchases() call.
  bool _restoreReceivedEvents = false;
  Timer? _restoreTimer;

  IAPNotifier(this._ref) : super(const IAPState()) {
    _init();
  }

  Future<void> _init() async {
    // Attach purchase stream BEFORE anything else so no events are missed.
    // This is critical for iOS subscription renewals and Android pending
    // purchases that are delivered as soon as the billing client connects.
    _purchaseSub = _iap.purchaseStream.listen(
      _handlePurchaseUpdates,
      onError: (err) => debugPrint('[IAP] stream error: $err'),
    );

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

  /// Re-fetch products from the store (shown when first load fails).
  Future<void> reloadProducts() async {
    state = state.copyWith(status: IAPStatus.loading, errorMessage: null);
    await _loadProducts();
  }

  /// Trigger a purchase for the given [ProductDetails].
  Future<void> buy(ProductDetails product) async {
    if (!state.isAvailable) return;
    state = state.copyWith(status: IAPStatus.purchasing, errorMessage: null);
    final param = PurchaseParam(productDetails: product);
    // buyNonConsumable works for both non-consumables and subscriptions.
    await _iap.buyNonConsumable(purchaseParam: param);
    // Result arrives via _handlePurchaseUpdates.
  }

  /// Restore previous purchases.
  ///
  /// Required by App Store review guidelines (iOS).
  /// If no restored purchases arrive within [_kRestoreTimeout], transitions to
  /// [IAPStatus.restoreEmpty] so the UI can show a "nothing found" message.
  static const _kRestoreTimeout = Duration(seconds: 10);

  Future<void> restorePurchases() async {
    if (!state.isAvailable) return;
    _restoreReceivedEvents = false;
    _restoreTimer?.cancel();

    state = state.copyWith(status: IAPStatus.purchasing, errorMessage: null);
    await _iap.restorePurchases();

    // Start a watchdog. If no restored events arrive in time, reset to idle.
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
          // Mark that at least one restore event was received (disarms watchdog).
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
          // Always finalize on error to clear the transaction from the queue.
          await _finalize(purchase);

        case PurchaseStatus.canceled:
          state = state.copyWith(status: IAPStatus.cancelled);
          await _finalize(purchase);
      }
    }
  }

  Future<void> _completePurchase(PurchaseDetails purchase) async {
    // If the user is not logged in yet, store the purchase and ask them to
    // create an account.  We intentionally do NOT finalize the transaction
    // here — it will be finalized after the backend verifies it post-signup.
    final isLoggedIn = _ref.read(authProvider).isLoggedIn;
    if (!isLoggedIn) {
      state = state.copyWith(
        status: IAPStatus.pendingAccountSetup,
        pendingPurchase: purchase,
      );
      return;
    }

    state = state.copyWith(status: IAPStatus.verifying);

    try {
      await _verifyWithBackend(purchase);
      // Only acknowledge AFTER successful backend verification.
      // Acknowledging before verification would prevent auto-refund on Android
      // for purchases that could not be verified.
      await _finalize(purchase);
    } catch (e) {
      debugPrint('[IAP] backend verification error: $e');
      final message = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Purchase verification failed. Please contact support if the issue persists.';
      state = state.copyWith(status: IAPStatus.error, errorMessage: message);

      // Platform-specific finalize on error:
      //   iOS   — complete the transaction to clear it from the StoreKit queue.
      //           The user can re-attempt via Restore Purchases.
      //   Android — do NOT acknowledge. Google Play auto-refunds unacknowledged
      //             purchases after 3 days, the safe default for failed verification.
      if (!kIsWeb && Platform.isIOS) {
        await _finalize(purchase);
      }
    }
  }

  /// Called by AccountSetupScreen after signup to verify the stored pending
  /// purchase and link it to the newly-created account.
  Future<void> verifyPendingPurchase() async {
    final purchase = state.pendingPurchase;
    if (purchase == null) return;

    state = state.copyWith(status: IAPStatus.verifying);
    try {
      await _verifyWithBackend(purchase);
      await _finalize(purchase);
      state = state.copyWith(clearPendingPurchase: true);
    } catch (e) {
      debugPrint('[IAP] pending purchase verify error: $e');
      final message = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Could not verify your purchase. Please contact support.';
      state = state.copyWith(status: IAPStatus.error, errorMessage: message);
      if (!kIsWeb && Platform.isIOS) {
        await _finalize(purchase);
      }
    }
  }

  void clearPendingAccountSetup() {
    state = state.copyWith(
      status: IAPStatus.idle,
      clearPendingPurchase: true,
    );
  }

  Future<void> _verifyWithBackend(PurchaseDetails purchase) async {
    final productId  = purchase.productID;
    final serverData = purchase.verificationData.serverVerificationData;

    final Map<String, dynamic> body;

    if (!kIsWeb && Platform.isIOS) {
      // serverVerificationData on iOS is the base64-encoded App Store receipt.
      body = {
        'platform':    'apple',
        'productId':   productId,
        'receiptData': serverData,
      };
    } else {
      // Android: serverVerificationData is the purchase token.
      body = {
        'platform':      'google',
        'productId':     productId,
        'purchaseToken': serverData,
        'orderId':       purchase.purchaseID ?? '',
      };
    }

    final response = await ApiClient.instance.dio.post(
      '/api/mobile-purchases/verify',
      data: body,
    );

    final data = response.data as Map<String, dynamic>;

    // Check explicit server failure.
    if (data['success'] != true) {
      throw Exception(data['error'] ?? 'Verification failed');
    }

    // B4 fix: also validate that the backend actually granted access.
    // success:true but hasAccess:false indicates a cross-account collision or
    // a backend logic error — neither should show a success dialog.
    final hasAccess = data['hasAccess'] as bool? ?? false;
    if (!hasAccess) {
      throw Exception(
        'Purchase was recorded but access could not be confirmed. '
        'Please contact support@themuslimman.com',
      );
    }

    // Refresh auth state so hasAccess updates throughout the app.
    await _ref.read(authProvider.notifier).refreshAccessAfterPurchase();

    state = state.copyWith(
      status: IAPStatus.success,
      successProductId: productId,
    );
  }

  /// Calls completePurchase() only when the OS requires acknowledgment.
  ///
  /// On iOS, this finishes the StoreKit transaction.
  /// On Android, this acknowledges the purchase to prevent automatic refund.
  Future<void> _finalize(PurchaseDetails purchase) async {
    if (purchase.pendingCompletePurchase) {
      await _iap.completePurchase(purchase);
    }
  }

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
