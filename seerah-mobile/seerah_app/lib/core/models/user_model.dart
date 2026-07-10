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

  const UserModel({
    this.email,
    this.name,
    this.hasAccess = false,
    this.isFamily = false,
    this.role = 'student',
    this.isAnonymous = false,
  });

  UserModel copyWith({
    String? email,
    String? name,
    bool? hasAccess,
    bool? isFamily,
    String? role,
    bool? isAnonymous,
  }) {
    return UserModel(
      email: email ?? this.email,
      name: name ?? this.name,
      hasAccess: hasAccess ?? this.hasAccess,
      isFamily: isFamily ?? this.isFamily,
      role: role ?? this.role,
      isAnonymous: isAnonymous ?? this.isAnonymous,
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
    );
  }
}
