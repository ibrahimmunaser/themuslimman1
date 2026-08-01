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

  const UserModel({
    this.email,
    this.name,
    this.hasAccess = false,
    this.isFamily = false,
    this.role = 'student',
    this.isAnonymous = false,
    this.emailVerified = false,
    this.purchasePlatform,
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
    );
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      email: json['email'] as String?,
      name: json['name'] as String?,
      hasAccess: json['hasPurchase'] as bool? ?? false,
      isFamily: json['isFamily'] as bool? ?? false,
      role: json['role'] as String? ?? 'student',
      isAnonymous: json['isAnonymous'] as bool? ?? false,
      emailVerified: json['emailVerified'] as bool? ?? false,
      purchasePlatform: json['purchasePlatform'] as String?,
    );
  }
}
