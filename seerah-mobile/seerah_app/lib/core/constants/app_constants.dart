class AppConstants {
  // App version — keep in sync with pubspec.yaml version field
  static const String appVersion = '1.0.0';

  // API
  static const String baseUrl = 'https://themuslimman.com';

  // Storage keys
  static const String keyIsLoggedIn = 'is_logged_in';
  static const String keyUserEmail = 'user_email';
  static const String keyUserName = 'user_name';
  static const String keyHasAccess = 'has_access';
  static const String keyIsFamily = 'is_family';
  static const String keyUserRole = 'user_role';
  static const String keyCookies = 'auth_cookies';

  // All auth-related pref keys — used for selective clear on logout
  static const List<String> authPrefKeys = [
    keyIsLoggedIn,
    keyUserEmail,
    keyUserName,
    keyHasAccess,
    keyIsFamily,
    keyUserRole,
    keyCookies,
  ];

  // Plans — fallback prices shown while store products load
  static const String monthlyPrice        = '4.99';
  static const String familyMonthlyPrice  = '9.99';
  static const String lifetimePrice       = '49';
  static const String familyLifetimePrice = '99';

  // In-App Purchase product IDs
  // These must match exactly what is registered in App Store Connect and Google Play Console.
  static const String iapMonthlyIndividual  = 'com.themuslimman.seerah.monthly.individual';
  static const String iapMonthlyFamily      = 'com.themuslimman.seerah.monthly.family';
  static const String iapLifetimeIndividual = 'com.themuslimman.seerah.lifetime.individual';
  static const String iapLifetimeFamily     = 'com.themuslimman.seerah.lifetime.family';

  static const Set<String> iapProductIds = {
    iapMonthlyIndividual,
    iapMonthlyFamily,
    iapLifetimeIndividual,
    iapLifetimeFamily,
  };
}
