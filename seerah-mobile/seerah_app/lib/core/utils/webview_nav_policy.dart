/// Blocks in-app WebView navigations that can complete digital-content
/// purchases outside store IAP (Guideline 3.1.1 on iOS; Play digital-goods
/// policy on Android). `/billing` is allowed for managing existing Stripe
/// entitlements (Customer Portal may redirect to billing.stripe.com).
bool shouldBlockInAppPurchaseNavigation(String url) {
  final uri = Uri.tryParse(url);
  if (uri == null) return true;

  final host = uri.host.toLowerCase();
  final path = uri.path.toLowerCase();

  // Block purchase flows; allow Customer Portal (billing.stripe.com).
  if (host.contains('checkout.stripe.com') ||
      host.contains('pay.stripe.com') ||
      host.contains('stripecdn.com') ||
      host.contains('stripe.network')) {
    return true;
  }
  // Generic stripe.com hosts that aren't the billing portal — block buy/UI.
  if (host == 'stripe.com' || host == 'www.stripe.com' || host.startsWith('js.stripe.com')) {
    return true;
  }

  // Web paywall / checkout that can start a Stripe purchase. /billing is the
  // management surface for existing Stripe entitlement — do not block it.
  if (path == '/pricing' ||
      path.startsWith('/pricing/') ||
      path == '/checkout' ||
      path.startsWith('/checkout/') ||
      path == '/upgrade' ||
      path.startsWith('/upgrade/')) {
    return true;
  }

  return false;
}
