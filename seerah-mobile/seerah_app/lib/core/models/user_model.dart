class UserModel {
  final String? email;
  final String? name;
  final bool hasAccess;
  final bool isFamily;
  final String role;

  const UserModel({
    this.email,
    this.name,
    this.hasAccess = false,
    this.isFamily = false,
    this.role = 'student',
  });

  UserModel copyWith({
    String? email,
    String? name,
    bool? hasAccess,
    bool? isFamily,
    String? role,
  }) {
    return UserModel(
      email: email ?? this.email,
      name: name ?? this.name,
      hasAccess: hasAccess ?? this.hasAccess,
      isFamily: isFamily ?? this.isFamily,
      role: role ?? this.role,
    );
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      email: json['email'] as String?,
      name: json['name'] as String?,
      hasAccess: json['hasPurchase'] as bool? ?? false,
      isFamily: json['isFamily'] as bool? ?? false,
      role: json['role'] as String? ?? 'student',
    );
  }
}
