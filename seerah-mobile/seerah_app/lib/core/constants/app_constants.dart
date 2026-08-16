class AppConstants {
  // App version — keep in sync with pubspec.yaml version field
  static const String appVersion = '1.0.42';

  // API
  static const String baseUrl = 'https://themuslimman.com';

  // Storage keys
  static const String keyIsLoggedIn = 'is_logged_in';
  static const String keyUserEmail = 'user_email';
  static const String keyUserName = 'user_name';
  static const String keyHasAccess = 'has_access';
  static const String keyIsFamily = 'is_family';
  static const String keyUserRole = 'user_role';
  static const String keyIsAnonymous = 'is_anonymous';
  static const String keyEmailVerified = 'email_verified';

  /// "stripe" | "google" | "apple" | null (no active access). Mirrors
  /// /api/access/check's `purchasePlatform` — tells "Manage Subscription"
  /// where to actually route the user instead of guessing from the OS the
  /// app happens to be running on today (a Stripe web subscriber signed in
  /// on Android must NOT be sent to the Play Store subscription center, and
  /// a Play purchaser must NOT be sent to Stripe's web billing portal).
  static const String keyPurchasePlatform = 'purchase_platform';

  /// Last known active learner profile id — used to scope the local
  /// on-device progress cache per profile so switching profiles on a
  /// shared family device never shows one learner's progress merged into
  /// another's. Kept out of [authPrefKeys] on purpose: progressProvider
  /// clears it explicitly (see ProgressNotifier.clearAll).
  static const String keyActiveProfileId = 'active_profile_id';

  // All auth-related pref keys — used for selective clear on logout
  static const List<String> authPrefKeys = [
    keyIsLoggedIn,
    keyUserEmail,
    keyUserName,
    keyHasAccess,
    keyIsFamily,
    keyUserRole,
    keyIsAnonymous,
    keyEmailVerified,
    keyPurchasePlatform,
  ];

  // Plans — fallback prices shown while store products load
  static const String monthlyPrice        = '9.99';
  static const String familyMonthlyPrice  = '9.99';
  static const String lifetimePrice       = '49';
  static const String familyLifetimePrice = '79';

  // In-App Purchase product IDs
  // These must match exactly what is registered in App Store Connect and Google Play Console.
  static const String iapMonthlyIndividual  = 'seerah_monthly_individual';
  static const String iapMonthlyFamily      = 'seerah_monthly_family';
  static const String iapLifetimeIndividual = 'seerah_lifetime_individual';
  static const String iapLifetimeFamily     = 'seerah_lifetime_family';

  // Legacy reverse-DNS IDs — queried defensively alongside the seerah_* IDs.
  // A stale doc (STORE_RELEASE_CHECKLIST.md) suggested App Store Connect may
  // still have these registered from before the seerah_* rename, which would
  // silently break "Buy" on iOS (Apple rejection Guideline 2.1(b)) since
  // queryProductDetails would never find seerah_* there. Querying both sets
  // and using whichever one the store actually returns is a safe no-op if
  // the IDs already match.
  static const String iapMonthlyIndividualLegacy  = 'com.themuslimman.seerah.monthly.individual';
  static const String iapMonthlyFamilyLegacy      = 'com.themuslimman.seerah.monthly.family';
  static const String iapLifetimeIndividualLegacy = 'com.themuslimman.seerah.lifetime.individual';
  static const String iapLifetimeFamilyLegacy     = 'com.themuslimman.seerah.lifetime.family';

  /// Public plans offered in the paywall UI (Individual Monthly + Lifetime).
  /// Family SKUs stay queryable for restore / existing family accounts but are
  /// not sold as a public purchase option.
  static const List<String> iapPublicPlanIds = [
    iapMonthlyIndividual,
    iapLifetimeIndividual,
  ];

  /// Number of distinct plans on the public paywall (used for "X of Y plans
  /// loaded" UI messaging) — NOT the same as iapProductIds.length, which
  /// includes family + legacy candidate IDs for restore compatibility.
  static const int iapPlanCount = 2;

  /// Maps each canonical plan ID to every product ID that might represent it
  /// in the store. [IAPState.productForPlan] tries them in order.
  static const Map<String, List<String>> iapProductIdCandidates = {
    iapMonthlyIndividual: [iapMonthlyIndividual, iapMonthlyIndividualLegacy],
    iapMonthlyFamily: [iapMonthlyFamily, iapMonthlyFamilyLegacy],
    iapLifetimeIndividual: [iapLifetimeIndividual, iapLifetimeIndividualLegacy],
    iapLifetimeFamily: [iapLifetimeFamily, iapLifetimeFamilyLegacy],
  };

  // Full set queried from the store — includes legacy fallbacks and family
  // SKUs so existing family purchases can still restore.
  static const Set<String> iapProductIds = {
    iapMonthlyIndividual,
    iapMonthlyFamily,
    iapLifetimeIndividual,
    iapLifetimeFamily,
    iapMonthlyIndividualLegacy,
    iapMonthlyFamilyLegacy,
    iapLifetimeIndividualLegacy,
    iapLifetimeFamilyLegacy,
  };
}
