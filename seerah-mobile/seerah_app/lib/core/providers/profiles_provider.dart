import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../models/profile_model.dart';
import '../network/api_client.dart';
import 'progress_provider.dart';

class ProfilesNotifier extends AsyncNotifier<ProfilesState> {
  // Guards against double-tap races on switch/create/delete/rename — e.g. rapidly
  // tapping two profile tiles, the "Add" button twice, or a delete
  // confirmation twice, before the first request returns.
  bool _switching = false;
  bool _creating = false;
  bool _deleting = false;
  bool _renaming = false;

  @override
  Future<ProfilesState> build() async {
    return _fetchProfiles();
  }

  Future<void> _cacheActiveProfileId(String? profileId) async {
    if (profileId == null) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyActiveProfileId, profileId);
  }

  Future<ProfilesState> _fetchProfiles() async {
    final response = await ApiClient.instance.dio.get('/api/mobile-profiles');
    final data = response.data as Map<String, dynamic>;

    final profiles = (data['profiles'] as List)
        .map((p) => ProfileModel.fromJson(p as Map<String, dynamic>))
        .toList();

    final activeProfileId = data['activeProfileId'] as String?;
    await _cacheActiveProfileId(activeProfileId);

    return ProfilesState(
      profiles: profiles,
      activeProfileId: activeProfileId,
      profileLimit: data['profileLimit'] as int? ?? 1,
      canAddMore: data['canAddMore'] as bool? ?? false,
    );
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetchProfiles);
  }

  /// Switches the active learner profile. Returns error message or null.
  Future<String?> switchProfile(String profileId) async {
    if (_switching) return 'Please wait — still switching profiles.';
    _switching = true;
    try {
      await ApiClient.instance.dio.post(
        '/api/mobile-profiles/switch',
        data: {'profileId': profileId},
      );
      await _cacheActiveProfileId(profileId);

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
    } finally {
      _switching = false;
    }
  }

  /// Creates a new profile. Returns error message or null.
  ///
  /// Note: the client-side `canAddMore` flag is only a UI hint (it can be
  /// stale between fetches). The server re-checks the plan's profile limit
  /// on every POST and returns a proper 403 error if it's already full —
  /// that's the real enforcement boundary, so a race here can't create more
  /// profiles than the plan allows.
  Future<String?> createProfile(String displayName, {String? avatar}) async {
    if (_creating) return 'Please wait — still adding a profile.';
    _creating = true;
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
      final dioMsg = e is Exception ? _dioErrorMessage(e) : null;
      return dioMsg ?? 'Could not create profile. Please try again.';
    } finally {
      _creating = false;
    }
  }

  String? _dioErrorMessage(Object e) {
    try {
      final data = (e as dynamic).response?.data;
      if (data is Map && data['error'] is String) return data['error'] as String;
    } catch (_) {}
    return null;
  }

  /// Deletes a profile. Returns error message or null.
  Future<String?> deleteProfile(String profileId) async {
    if (_deleting) return 'Please wait — still deleting a profile.';
    _deleting = true;
    try {
      final wasActive = state.valueOrNull?.activeProfileId == profileId;
      final response = await ApiClient.instance.dio.delete(
        '/api/mobile-profiles/$profileId',
      );
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true) {
        // Clean up the deleted learner's local progress cache so it doesn't
        // linger on-device forever under a dead profile id.
        await ref.read(progressProvider.notifier).clearForProfile(profileId);
        if (wasActive) {
          // The server picks a new active profile when the current one is
          // deleted, but progressProvider's in-memory ProgressState is still
          // holding the just-deleted profile's (now stale) viewed/quiz data
          // — clearForProfile above only wipes its on-disk cache, not the
          // notifier's live state. Without a full reset, any screen still
          // reading progressProvider right after this delete (e.g. the
          // dashboard behind this one) would keep showing the deleted
          // learner's progress until something else happens to invalidate
          // it.
          await ref.read(progressProvider.notifier).reset();
        }
        await refresh();
        return null;
      }
      return data['error'] as String? ?? 'Could not delete profile.';
    } catch (e) {
      debugPrint('[Profiles] delete error: $e');
      return 'Could not delete profile. Please try again.';
    } finally {
      _deleting = false;
    }
  }

  /// Renames a profile. Returns error message or null.
  Future<String?> renameProfile(String profileId, String newName) async {
    if (_renaming) return 'Please wait — still renaming a profile.';
    _renaming = true;
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
    } finally {
      _renaming = false;
    }
  }
}

final profilesProvider =
    AsyncNotifierProvider<ProfilesNotifier, ProfilesState>(ProfilesNotifier.new);
