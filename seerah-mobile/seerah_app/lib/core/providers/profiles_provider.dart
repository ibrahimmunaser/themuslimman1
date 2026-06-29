import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/profile_model.dart';
import '../network/api_client.dart';

class ProfilesNotifier extends AsyncNotifier<ProfilesState> {
  @override
  Future<ProfilesState> build() async {
    return _fetchProfiles();
  }

  Future<ProfilesState> _fetchProfiles() async {
    try {
      final response = await ApiClient.instance.dio.get('/api/mobile-profiles');
      final data = response.data as Map<String, dynamic>;

      final profiles = (data['profiles'] as List)
          .map((p) => ProfileModel.fromJson(p as Map<String, dynamic>))
          .toList();

      return ProfilesState(
        profiles: profiles,
        activeProfileId: data['activeProfileId'] as String?,
        profileLimit: data['profileLimit'] as int? ?? 1,
        canAddMore: data['canAddMore'] as bool? ?? false,
      );
    } catch (e) {
      debugPrint('[Profiles] fetch error: $e');
      return const ProfilesState();
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = AsyncData(await _fetchProfiles());
  }

  /// Switches the active learner profile. Returns error message or null.
  Future<String?> switchProfile(String profileId) async {
    try {
      await ApiClient.instance.dio.post(
        '/api/mobile-profiles/switch',
        data: {'profileId': profileId},
      );

      // Update local state immediately
      final current = state.valueOrNull ?? const ProfilesState();
      final updated = ProfilesState(
        profiles: current.profiles
            .map((p) => p.copyWith(isActive: p.id == profileId))
            .toList(),
        activeProfileId: profileId,
        profileLimit: current.profileLimit,
        canAddMore: current.canAddMore,
      );
      state = AsyncData(updated);
      return null;
    } catch (e) {
      debugPrint('[Profiles] switch error: $e');
      return 'Could not switch profile. Please try again.';
    }
  }

  /// Creates a new profile. Returns error message or null.
  Future<String?> createProfile(String displayName, {String? avatar}) async {
    try {
      final response = await ApiClient.instance.dio.post(
        '/api/mobile-profiles',
        data: {'displayName': displayName, 'avatar': avatar},
      );
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true) {
        await refresh();
        return null;
      }
      return data['error'] as String? ?? 'Could not create profile.';
    } catch (e) {
      debugPrint('[Profiles] create error: $e');
      return 'Could not create profile. Please try again.';
    }
  }

  /// Deletes a profile. Returns error message or null.
  Future<String?> deleteProfile(String profileId) async {
    try {
      final response = await ApiClient.instance.dio.delete(
        '/api/mobile-profiles/$profileId',
      );
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true) {
        await refresh();
        return null;
      }
      return data['error'] as String? ?? 'Could not delete profile.';
    } catch (e) {
      debugPrint('[Profiles] delete error: $e');
      return 'Could not delete profile. Please try again.';
    }
  }

  /// Renames a profile. Returns error message or null.
  Future<String?> renameProfile(String profileId, String newName) async {
    try {
      final response = await ApiClient.instance.dio.patch(
        '/api/mobile-profiles/$profileId',
        data: {'displayName': newName},
      );
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true) {
        final current = state.valueOrNull ?? const ProfilesState();
        final updated = ProfilesState(
          profiles: current.profiles
              .map((p) => p.id == profileId ? p.copyWith(displayName: newName) : p)
              .toList(),
          activeProfileId: current.activeProfileId,
          profileLimit: current.profileLimit,
          canAddMore: current.canAddMore,
        );
        state = AsyncData(updated);
        return null;
      }
      return data['error'] as String? ?? 'Could not rename profile.';
    } catch (e) {
      debugPrint('[Profiles] rename error: $e');
      return 'Could not rename profile. Please try again.';
    }
  }
}

final profilesProvider =
    AsyncNotifierProvider<ProfilesNotifier, ProfilesState>(ProfilesNotifier.new);
