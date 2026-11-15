class UserModel {
  final String? email;
  final String? name;
  final bool hasAccess;
  final bool isFamily;
  final String role;

  /// True for a silent, device-linked guest account created before checkout
  /// with no personal info collected (Apple Guideline 5.1.1(v)). Becomes
  /// false once the user optionally upgrades to a real email/password account.
  final bool isAnonymous;

  /// True once the user has clicked the verification link emailed to them.
  /// Always true for anonymous guest accounts (they have no real email to
  /// verify — see /api/auth/mobile-anonymous). Meaningless/defaults to false
  /// until the first real signin/upgrade/access-check response populates it.
  /// Audit M-resend-verify: mobile never gated anything on this (unlike web),
  /// but a real-account user whose verification email bounced/expired/was
  /// never sent had literally no way to trigger a new one from the app.
  final bool emailVerified;

  /// "stripe" | "google" | "apple" | null. The platform through which the
  /// user's CURRENT active access was purchased, as reported by
  /// /api/access/check. Null when there's no active access to attribute a
  /// platform to (e.g. anonymous guest, or a lapsed subscription).
  final String? purchasePlatform;

  /// "lifetime" | "monthly" | null — null when there's no active access.
  /// Mirrors app/api/access/check's `plan.interval`.
  final String? planInterval;

  /// What the plan actually costs, in cents — only populated for Stripe
  /// purchases (lifetime Purchase row, or a live subscription price lookup).
  /// Deliberately null for Apple/Google IAP: the receipt never reports the
  /// exact amount charged (and regional store pricing can differ from the US
  /// price), so the UI must not guess — see access/check route's doc comment.
  final int? planAmountCents;

  /// Lowercase ISO currency code (e.g. "usd") paired with [planAmountCents].
  /// Null whenever [planAmountCents] is null.
  final String? planCurrency;

  /// ISO 8601 timestamp of the next renewal (or, if [planCancelAtPeriodEnd]
  /// is true, the date access ends) for a monthly plan. Null for lifetime
  /// plans or when unknown (e.g. Apple IAP with no stored period end yet).
  final String? planRenewsAt;

  /// True if a Stripe monthly subscription is set to cancel at
  /// [planRenewsAt] instead of renewing. Null when not applicable/unknown
  /// (lifetime plans, or Apple/Google IAP where this isn't tracked here).
  final bool? planCancelAtPeriodEnd;

  const UserModel({
    this.email,
    this.name,
    this.hasAccess = false,
    this.isFamily = false,
    this.role = 'student',
    this.isAnonymous = false,
    this.emailVerified = false,
    this.purchasePlatform,
    this.planInterval,
    this.planAmountCents,
    this.planCurrency,
    this.planRenewsAt,
    this.planCancelAtPeriodEnd,
  });

  UserModel copyWith({
    String? email,
    String? name,
    bool? hasAccess,
    bool? isFamily,
    String? role,
    bool? isAnonymous,
    bool? emailVerified,
    String? purchasePlatform,
    bool clearPurchasePlatform = false,
    String? planInterval,
    int? planAmountCents,
    String? planCurrency,
    String? planRenewsAt,
    bool? planCancelAtPeriodEnd,
    bool clearPlan = false,
  }) {
    return UserModel(
      email: email ?? this.email,
      name: name ?? this.name,
      hasAccess: hasAccess ?? this.hasAccess,
      isFamily: isFamily ?? this.isFamily,
      role: role ?? this.role,
      isAnonymous: isAnonymous ?? this.isAnonymous,
      emailVerified: emailVerified ?? this.emailVerified,
      purchasePlatform: clearPurchasePlatform
          ? null
          : (purchasePlatform ?? this.purchasePlatform),
      planInterval: clearPlan ? null : (planInterval ?? this.planInterval),
      planAmountCents: clearPlan ? null : (planAmountCents ?? this.planAmountCents),
      planCurrency: clearPlan ? null : (planCurrency ?? this.planCurrency),
      planRenewsAt: clearPlan ? null : (planRenewsAt ?? this.planRenewsAt),
      planCancelAtPeriodEnd: clearPlan ? null : (planCancelAtPeriodEnd ?? this.planCancelAtPeriodEnd),
    );
  }

  /// Applies the `plan` object from an /api/access/check response. Separate
  /// from the constructor/copyWith's individual plan fields so every call
  /// site that already parses that response (login, ensureSession,
  /// upgradeAccount, _verifySession) can apply it identically in one line
  /// instead of repeating the same four-field extraction each time.
  UserModel withPlanJson(Map<String, dynamic>? planJson) {
    if (planJson == null) return copyWith(clearPlan: true);
    return copyWith(
      clearPlan: true,
      planInterval: planJson['interval'] as String?,
      planAmountCents: planJson['amountCents'] as int?,
      planCurrency: planJson['currency'] as String?,
      planRenewsAt: planJson['renewsAt'] as String?,
      planCancelAtPeriodEnd: planJson['cancelAtPeriodEnd'] as bool?,
    );
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final planJson = json['plan'] as Map<String, dynamic>?;
    return UserModel(
      email: json['email'] as String?,
      name: json['name'] as String?,
      hasAccess: json['hasPurchase'] as bool? ?? false,
      isFamily: json['isFamily'] as bool? ?? false,
      role: json['role'] as String? ?? 'student',
      isAnonymous: json['isAnonymous'] as bool? ?? false,
      emailVerified: json['emailVerified'] as bool? ?? false,
      purchasePlatform: json['purchasePlatform'] as String?,
      planInterval: planJson?['interval'] as String?,
      planAmountCents: planJson?['amountCents'] as int?,
      planCurrency: planJson?['currency'] as String?,
      planRenewsAt: planJson?['renewsAt'] as String?,
      planCancelAtPeriodEnd: planJson?['cancelAtPeriodEnd'] as bool?,
    );
  }
}
