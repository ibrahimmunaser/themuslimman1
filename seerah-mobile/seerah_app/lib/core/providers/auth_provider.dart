import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../models/user_model.dart';
import '../network/api_client.dart';
import 'progress_provider.dart';

class AuthState {
  final bool isLoggedIn;
  final bool isLoading;
  final UserModel? user;
  final String? error;

  const AuthState({
    this.isLoggedIn = false,
    this.isLoading = true,
    this.user,
    this.error,
  });

  bool get hasAccess => user?.hasAccess ?? false;
  bool get isAnonymous => user?.isAnonymous ?? false;

  AuthState copyWith({
    bool? isLoggedIn,
    bool? isLoading,
    UserModel? user,
    String? error,
  }) {
    return AuthState(
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final Ref _ref;

  AuthNotifier(this._ref) : super(const AuthState()) {
    _restore();
  }

  Future<void> _restore() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final isLoggedIn = prefs.getBool(AppConstants.keyIsLoggedIn) ?? false;
      if (isLoggedIn) {
        final user = UserModel(
          email: prefs.getString(AppConstants.keyUserEmail),
          name: prefs.getString(AppConstants.keyUserName),
          hasAccess: prefs.getBool(AppConstants.keyHasAccess) ?? false,
          isFamily: prefs.getBool(AppConstants.keyIsFamily) ?? false,
          role: prefs.getString(AppConstants.keyUserRole) ?? 'student',
          isAnonymous: prefs.getBool(AppConstants.keyIsAnonymous) ?? false,
        );
        state = AuthState(isLoggedIn: true, isLoading: false, user: user);
        // Silently verify the session is still valid (non-blocking)
        _verifySession();
      } else {
        state = const AuthState(isLoggedIn: false, isLoading: false);
      }
    } catch (e) {
      state = const AuthState(isLoggedIn: false, isLoading: false);
    }
  }

  /// Called from the app lifecycle observer when the app returns to foreground
  /// (e.g. after user completes checkout in browser — Bug 8 fix).
  Future<void> refreshAccessOnResume() async {
    if (!state.isLoggedIn) return;
    await _verifySession();
  }

  /// Called by IAPNotifier after a successful purchase verification so the
  /// hasAccess flag is immediately reflected in all screens.
  Future<void> refreshAccessAfterPurchase() async {
    if (!state.isLoggedIn) return;
    await _verifySession();
  }

  /// Bug 2 fix: only log out on confirmed 401/403; keep session alive on
  /// network timeouts and other transient errors.
  /// Bug 4 fix: guard null user before calling _saveUser.
  Future<void> _verifySession() async {
    try {
      // Use the unified endpoint (covers Stripe + Apple IAP + Google Play IAP).
      final response = await ApiClient.instance.dio.get('/api/access/check');
      final hasAccess = response.data['hasAccess'] as bool? ?? false;
      final user = state.user?.copyWith(hasAccess: hasAccess);
      if (user != null) {
        state = state.copyWith(user: user);
        await _saveUser(user);
      }
    } on DioException catch (e) {
      // Only treat an authenticated 401/403 as true session expiry
      final status = e.response?.statusCode;
      if (status == 401 || status == 403) {
        await logout();
      }
      // Network errors, timeouts, 5xx: keep the cached session active
    } catch (_) {
      // Unknown errors: keep session active
    }
  }

  Future<String?> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient.instance.dio.post(
        '/api/auth/signin',
        data: {'email': email.trim(), 'password': password},
      );
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true) {
        bool hasAccess = data['hasPurchase'] as bool? ?? false;
        try {
          final accessRes = await ApiClient.instance.dio.get('/api/access/check');
          hasAccess = accessRes.data['hasAccess'] as bool? ?? hasAccess;
        } catch (_) {}

        final user = UserModel(
          email: email.trim(),
          hasAccess: hasAccess,
          isFamily: data['isFamily'] as bool? ?? false,
          role: data['role'] as String? ?? 'student',
        );
        await _saveUser(user);
        state = AuthState(isLoggedIn: true, isLoading: false, user: user);
        return null;
      }
      state = state.copyWith(isLoading: false, error: 'Login failed. Check your credentials.');
      return 'Login failed. Check your credentials.';
    } catch (e) {
      final msg = _parseError(e);
      state = state.copyWith(isLoading: false, error: msg);
      return msg;
    }
  }

  Future<String?> signup(String name, String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient.instance.dio.post(
        '/api/auth/signup-student',
        data: {'fullName': name.trim(), 'email': email.trim(), 'password': password},
      );
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true) {
        final user = UserModel(
          email: email.trim(),
          name: name.trim(),
          hasAccess: false,
          role: 'student',
        );
        await _saveUser(user);
        state = AuthState(isLoggedIn: true, isLoading: false, user: user);
        return null;
      }
      final msg = data['error'] as String? ?? 'Signup failed.';
      state = state.copyWith(isLoading: false, error: msg);
      return msg;
    } catch (e) {
      final msg = _parseError(e);
      state = state.copyWith(isLoading: false, error: msg);
      return msg;
    }
  }

  /// Guarantees the caller has a session before starting a purchase, without
  /// ever asking the user for personal information (Apple Guideline
  /// 5.1.1(v)). If already signed in (real or guest), this is a no-op.
  /// Otherwise it silently provisions a device-linked guest account.
  /// Returns true if a session now exists.
  Future<bool> ensureSession() async {
    if (state.isLoggedIn) return true;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient.instance.dio.post('/api/auth/mobile-anonymous');
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true) {
        final user = UserModel(
          hasAccess: data['hasAccess'] as bool? ?? false,
          isFamily: (data['planType'] as String?) == 'family',
          role: data['role'] as String? ?? 'student',
          isAnonymous: data['isAnonymous'] as bool? ?? true,
        );
        await _saveUser(user);
        state = AuthState(isLoggedIn: true, isLoading: false, user: user);
        return true;
      }
      state = state.copyWith(isLoading: false, error: 'Could not start checkout. Please try again.');
      return false;
    } catch (e) {
      final msg = _parseError(e);
      state = state.copyWith(isLoading: false, error: msg);
      return false;
    }
  }

  /// Fully optional upgrade of a guest account to a real email/password
  /// account — same user id, so purchases already made stay attached.
  /// Never required before or after purchase (Apple Guideline 5.1.1(v)).
  Future<String?> upgradeAccount(String name, String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient.instance.dio.post(
        '/api/auth/upgrade-account',
        data: {'fullName': name.trim(), 'email': email.trim(), 'password': password},
      );
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true) {
        final current = state.user ?? const UserModel();
        final user = current.copyWith(
          email: email.trim(),
          name: name.trim(),
          isAnonymous: false,
        );
        await _saveUser(user);
        state = state.copyWith(isLoading: false, user: user);
        return null;
      }
      final msg = data['error'] as String? ?? 'Could not create account.';
      state = state.copyWith(isLoading: false, error: msg);
      return msg;
    } catch (e) {
      final msg = _parseError(e);
      state = state.copyWith(isLoading: false, error: msg);
      return msg;
    }
  }

  /// Permanently and immediately deletes the account server-side (Apple
  /// Guideline 5.1.1(v) — apps that support account creation must also
  /// support in-app account deletion). Clears all local session state on
  /// success. Returns an error message on failure, or null on success.
  Future<String?> deleteAccount({String? password}) async {
    try {
      final response = await ApiClient.instance.dio.post(
        '/api/account/delete',
        data: password != null ? {'password': password} : <String, dynamic>{},
      );
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true) {
        await ApiClient.instance.clearCookies();
        final prefs = await SharedPreferences.getInstance();
        for (final key in AppConstants.authPrefKeys) {
          await prefs.remove(key);
        }
        await _ref.read(progressProvider.notifier).clearAll();
        state = const AuthState(isLoggedIn: false, isLoading: false);
        return null;
      }
      return data['error'] as String? ?? 'Could not delete account.';
    } catch (e) {
      return _parseError(e);
    }
  }

  Future<void> logout() async {
    try {
      await ApiClient.instance.dio.post('/api/auth/logout');
    } catch (_) {}
    await ApiClient.instance.clearCookies();

    // Remove only auth-specific keys instead of prefs.clear() to avoid
    // wiping preferences belonging to other packages.
    final prefs = await SharedPreferences.getInstance();
    for (final key in AppConstants.authPrefKeys) {
      await prefs.remove(key);
    }

    // Clear device-local progress so a different user signing in on the same
    // device does not see the previous user's viewed parts and quiz scores.
    await _ref.read(progressProvider.notifier).clearAll();

    state = const AuthState(isLoggedIn: false, isLoading: false);
  }

  Future<void> _saveUser(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(AppConstants.keyIsLoggedIn, true);
    if (user.email != null) await prefs.setString(AppConstants.keyUserEmail, user.email!);
    if (user.name != null) await prefs.setString(AppConstants.keyUserName, user.name!);
    await prefs.setBool(AppConstants.keyHasAccess, user.hasAccess);
    await prefs.setBool(AppConstants.keyIsFamily, user.isFamily);
    await prefs.setString(AppConstants.keyUserRole, user.role);
    await prefs.setBool(AppConstants.keyIsAnonymous, user.isAnonymous);
  }

  String _parseError(dynamic e) {
    if (kDebugMode) print('[AuthNotifier] error: $e');
    try {
      final data = (e as dynamic).response?.data;
      if (data is Map) return data['error'] as String? ?? 'Something went wrong.';
    } catch (_) {}
    return 'Something went wrong. Please try again.';
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});
