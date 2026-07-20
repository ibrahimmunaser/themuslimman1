import 'dart:io' show Platform;

/// App Store Guideline 3.1.1: iOS must not complete digital-content purchases
/// through any mechanism other than In-App Purchase (including in-app WebViews
/// that reach Stripe / web checkout).
bool shouldBlockInAppPurchaseNavigation(String url) {
  if (!Platform.isIOS) return false;

  final uri = Uri.tryParse(url);
  if (uri == null) return true;

  final host = uri.host.toLowerCase();
  final path = uri.path.toLowerCase();

  if (host.contains('stripe.com') ||
      host.contains('stripecdn.com') ||
      host.contains('stripe.network')) {
    return true;
  }

  // Web paywall / checkout / billing management that can start a Stripe purchase.
  if (path == '/pricing' ||
      path.startsWith('/pricing/') ||
      path == '/checkout' ||
      path.startsWith('/checkout/') ||
      path == '/billing' ||
      path.startsWith('/billing/') ||
      path == '/upgrade' ||
      path.startsWith('/upgrade/')) {
    return true;
  }

  return false;
}
