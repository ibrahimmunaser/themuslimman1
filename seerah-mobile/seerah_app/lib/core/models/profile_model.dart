class ProfileModel {
  final String id;
  final String displayName;
  final String? avatar;
  final bool isDefault;
  final bool isActive;
  final int partsStudied;

  const ProfileModel({
    required this.id,
    required this.displayName,
    this.avatar,
    required this.isDefault,
    required this.isActive,
    required this.partsStudied,
  });

  factory ProfileModel.fromJson(Map<String, dynamic> json) => ProfileModel(
        id: json['id'] as String,
        displayName: json['displayName'] as String,
        avatar: json['avatar'] as String?,
        isDefault: json['isDefault'] as bool? ?? false,
        isActive: json['isActive'] as bool? ?? false,
        partsStudied: json['partsStudied'] as int? ?? 0,
      );

  ProfileModel copyWith({
    String? id,
    String? displayName,
    String? avatar,
    bool? isDefault,
    bool? isActive,
    int? partsStudied,
  }) =>
      ProfileModel(
        id: id ?? this.id,
        displayName: displayName ?? this.displayName,
        avatar: avatar ?? this.avatar,
        isDefault: isDefault ?? this.isDefault,
        isActive: isActive ?? this.isActive,
        partsStudied: partsStudied ?? this.partsStudied,
      );
}

class ProfilesState {
  final List<ProfileModel> profiles;
  final String? activeProfileId;
  final int profileLimit;
  final bool canAddMore;

  const ProfilesState({
    this.profiles = const [],
    this.activeProfileId,
    this.profileLimit = 1,
    this.canAddMore = false,
  });

  ProfileModel? get activeProfile =>
      profiles.where((p) => p.isActive).firstOrNull ??
      profiles.where((p) => p.isDefault).firstOrNull ??
      profiles.firstOrNull;

  bool get hasMultipleProfiles => profiles.length > 1;
}
