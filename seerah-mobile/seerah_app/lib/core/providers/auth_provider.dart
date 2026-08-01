import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../models/user_model.dart';
import '../network/api_client.dart';
import '../network/cookie_helper.dart' as cookies;
import 'part_provider.dart';
import 'profiles_provider.dart';
import 'progress_provider.dart';

class AuthState {
  final bool isLoggedIn;
  final bool isLoading;
  final UserModel? user;
  final String? error;

  /// One-shot notice set when a background session check (not an explicit
  /// user tap on "Sign Out") finds the session already invalid and has to
  /// log the user out. The app root listens for this and shows a snackbar so
  /// the user isn't just silently bounced to the paywall with no
  /// explanation. Consumed via [AuthNotifier.consumeSessionExpiredNotice].
  final String? sessionExpiredNotice;

  const AuthState({
    this.isLoggedIn = false,
    this.isLoading = true,
    this.user,
    this.error,
    this.sessionExpiredNotice,
  });

  bool get hasAccess => user?.hasAccess ?? false;
  bool get isFamily => user?.isFamily ?? false;
  bool get isAnonymous => user?.isAnonymous ?? false;

  AuthState copyWith({
    bool? isLoggedIn,
    bool? isLoading,
    UserModel? user,
    String? error,
    String? sessionExpiredNotice,
    bool clearSessionExpiredNotice = false,
  }) {
    return AuthState(
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      error: error,
      sessionExpiredNotice: clearSessionExpiredNotice
          ? null
          : (sessionExpiredNotice ?? this.sessionExpiredNotice),
    );
  }
}

/// Result of [AuthNotifier.upgradeAccount] — richer than a plain error
/// string so the UI can offer "Sign in instead" when the email is already
/// taken by a different (real) account.
class UpgradeAccountResult {
  final bool success;
  final String? error;
  final bool accountExists;

  /// True when the server still requires the user to click the emailed
  /// verification link (only when they upgraded with no purchase yet — a
  /// guest who already has paid access is auto-verified). The UI should
  /// show a "check your email" notice rather than silently navigating on as
  /// if everything is fully done.
  final bool requiresVerification;

  /// Audit M7 fix: true when the server-side verification email genuinely
  /// failed to send (e.g. an email-provider outage) despite the account
  /// upgrade itself succeeding. Lets the UI say "we couldn't send it, use
  /// Resend from your profile" instead of "check your email" when no email
  /// is actually coming.
  final bool verificationEmailFailed;
  const UpgradeAccountResult({
    required this.success,
    this.error,
    this.accountExists = false,
    this.requiresVerification = false,
    this.verificationEmailFailed = false,
  });
}

class AuthNotifier extends StateNotifier<AuthState> {
  final Ref _ref;

  // Guards against a slow/stale response from one auth-mutating call
  // clobbering `state` after a NEWER one has already completed. This can
  // happen because ensureSession() is triggered automatically and
  // independently of user action (e.g. IAPNotifier calls it whenever the OS
  // purchase stream delivers a transaction while signed out) — it can race
  // a user manually completing login()/upgradeAccount() at the
  // same moment. Each mutating method snapshots the generation before its
  // awaits and only commits `state` if it's still the most recent op.
  int _opGeneration = 0;
  int _beginOp() {
    // Also advance the cookie jar's own generation counter (see
    // cookie_helper_native.dart) so any request already in flight when this
    // op started can no longer have its Set-Cookie response applied —
    // otherwise a slow request from the PREVIOUS session (e.g. a content
    // fetch still pending for a family member who just got signed out, or a
    // stale ensureSession() racing a real login()) could silently overwrite
    // this new session's freshly-stored cookie after the fact.
    ApiClient.instance.bumpCookieGeneration();
    return ++_opGeneration;
  }

  bool _isCurrentOp(int gen) => gen == _opGeneration;

  // Serializes explicit, user-initiated auth ops (login/upgradeAccount)
  // against auto-triggered ensureSession() calls. The generation counter
  // above stops a STALE response from clobbering state after the fact, but
  // by the time that's detected the damage may already be partly done:
  // login()'s Set-Cookie can be silently discarded by the generation guard
  // in cookie_helper_native.dart while login() itself still resolves
  // "success" server-side, which — before this lock existed — led to
  // `_saveUser()` persisting `isLoggedIn=true` to disk with no real session
  // cookie behind it (the device looks "logged in" forever, but every
  // subsequent request 401s). Rather than reconcile that after the fact,
  // ensureSession() now simply waits for any in-flight login()/
  // upgradeAccount() to finish first, so the two never race in the first
  // place — an automatic guest-session provisioning triggered by an IAP
  // purchase-stream replay is never more urgent than a user's own explicit
  // sign-in that's already underway.
  Completer<void>? _explicitAuthLock;

  Future<void> _awaitExplicitAuthLock() async {
    while (_explicitAuthLock != null) {
      try {
        await _explicitAuthLock!.future;
      } catch (_) {}
    }
  }

  Future<T> _withExplicitAuthLock<T>(Future<T> Function() body) async {
    await _awaitExplicitAuthLock();
    final lock = Completer<void>();
    _explicitAuthLock = lock;
    try {
      return await body();
    } finally {
      _explicitAuthLock = null;
      lock.complete();
    }
  }

  AuthNotifier(this._ref) : super(const AuthState()) {
    _restore();
  }

  Future<void> _restore() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final isLoggedIn = prefs.getBool(AppConstants.keyIsLoggedIn) ?? false;
      if (isLoggedIn) {
        // Prefs alone are not enough — without a session cookie, buy()/verify
        // would open Play Billing then 401 (orphaned purchases). ApiClient.init
        // already loaded the jar before ProviderScope mounts.
        if (!cookies.hasSessionCookie()) {
          for (final key in AppConstants.authPrefKeys) {
            await prefs.remove(key);
          }
          state = const AuthState(isLoggedIn: false, isLoading: false);
          return;
        }
        final user = UserModel(
          email: prefs.getString(AppConstants.keyUserEmail),
          name: prefs.getString(AppConstants.keyUserName),
          hasAccess: prefs.getBool(AppConstants.keyHasAccess) ?? false,
          isFamily: prefs.getBool(AppConstants.keyIsFamily) ?? false,
          role: prefs.getString(AppConstants.keyUserRole) ?? 'student',
          isAnonymous: prefs.getBool(AppConstants.keyIsAnonymous) ?? false,
          emailVerified: prefs.getBool(AppConstants.keyEmailVerified) ?? false,
          purchasePlatform: prefs.getString(AppConstants.keyPurchasePlatform),
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

  /// Applies hasAccess/isFamily directly from a response IAPNotifier already
  /// has in hand (the /api/mobile-purchases/verify response itself echoes
  /// these back). Unlike [refreshAccessAfterPurchase] this can never
  /// silently no-op: that method's underlying _verifySession() deliberately
  /// swallows every non-401/403 error (by design, so a flaky network doesn't
  /// spuriously log the user out) — which meant a timeout/5xx on that
  /// *second* round-trip left `hasAccess` stale even though the purchase had
  /// already been verified and granted server-side in the *first* call.
  void applyAccessUpdate({
    required bool hasAccess,
    bool? isFamily,
    String? purchasePlatform,
    bool? emailVerified,
  }) {
    final user = state.user;
    if (user == null) return;
    final hadAccess = user.hasAccess;
    final updated = user.copyWith(
      hasAccess: hasAccess,
      isFamily: isFamily ?? user.isFamily,
      purchasePlatform: purchasePlatform ?? user.purchasePlatform,
      clearPurchasePlatform: !hasAccess,
      emailVerified: emailVerified ?? user.emailVerified,
    );
    state = state.copyWith(user: updated);
    unawaited(_saveUser(updated));
    // Audit H6 fix: previously only `_verifySession` invalidated part
    // caches on access loss. A refund/revoke reflected via IAP verify's
    // applyAccessUpdate(hasAccess: false) left signed URLs / quiz payloads
    // cached in non-autoDispose providers for the rest of the process.
    if (hadAccess && !hasAccess) {
      _invalidatePartScopedProviders();
    }
  }

  /// Part-scoped content providers (video/audio URLs, quiz questions,
  /// flashcards, slides, infographics) are plain (non-autoDispose)
  /// `FutureProvider.family` instances — once fetched while the user had
  /// access, their resolved values (real signed asset URLs, quiz question
  /// text, etc.) stay cached in memory for the rest of the app process,
  /// with no built-in expiry. If access is later revoked (logout, session
  /// expiry, or a subscription genuinely lapsing while still signed in)
  /// without invalidating these, any part viewed earlier in the same
  /// session would keep re-serving its real cached content indefinitely —
  /// bypassing the paywall entirely rather than just risking a stale UI.
  void _invalidatePartScopedProviders() {
    _ref.invalidate(partAssetsProvider);
    _ref.invalidate(quizProvider);
    _ref.invalidate(flashcardSetProvider);
    _ref.invalidate(flashcardsProvider);
    _ref.invalidate(slidesProvider);
    _ref.invalidate(partContentProvider);
    _ref.invalidate(infographicsProvider);
    // Family-profile lists (and each profile's cached progress) are also
    // plain, non-autoDispose providers — without this, signing out of a
    // family account and signing into a different one on the same device
    // kept serving the FIRST account's profile list/avatars/progress until
    // the profiles screen happened to be force-refreshed.
    _ref.invalidate(profilesProvider);
  }

  /// Bug 2 fix: only log out on confirmed 401/403; keep session alive on
  /// network timeouts and other transient errors.
  /// Bug 4 fix: guard null user before calling _saveUser.
  Future<void> _verifySession() async {
    // Snapshot the generation BEFORE the await — deliberately WITHOUT calling
    // _beginOp() (this is a passive background check, not a state-changing
    // operation in its own right, so it must not invalidate a genuinely
    // concurrent login()/logout()/ensureSession()). If one of those runs
    // while this network call is in flight (e.g. the app resumes and fires
    // refreshAccessOnResume() right as the user taps "Sign Out", or a fast
    // logout→login as a different family member), the generation will have
    // moved on by the time this resolves — applying this response then
    // would silently overwrite the NEW session's hasAccess/isFamily with
    // the OLD (possibly logged-out or different-user) session's stale
    // values.
    final startGen = _opGeneration;
    try {
      // Use the unified endpoint (covers Stripe + Apple IAP + Google Play IAP).
      final response = await ApiClient.instance.dio.get('/api/access/check');
      if (!_isCurrentOp(startGen)) return;
      final hasAccess = response.data['hasAccess'] as bool? ?? false;
      final isFamily =
          response.data['isFamily'] as bool? ??
          (response.data['planType'] as String?) == 'family';
      final hadAccess = state.user?.hasAccess ?? false;
      final purchasePlatform = response.data['purchasePlatform'] as String?;
      final user = state.user?.copyWith(
        hasAccess: hasAccess,
        isFamily: isFamily,
        emailVerified: response.data['emailVerified'] as bool?,
        purchasePlatform: purchasePlatform,
        clearPurchasePlatform: purchasePlatform == null,
      );
      if (user != null) {
        state = state.copyWith(user: user);
        await _saveUser(user);
        if (hadAccess && !hasAccess) _invalidatePartScopedProviders();
      }
    } on DioException catch (e) {
      if (!_isCurrentOp(startGen)) return;
      // Only treat an authenticated 401/403 as true session expiry
      final status = e.response?.statusCode;
      if (status == 401 || status == 403) {
        await _handleSessionExpired();
      }
      // Network errors, timeouts, 5xx: keep the cached session active
    } catch (_) {
      // Unknown errors: keep session active
    }
  }

  /// Logs the user out because a BACKGROUND check (app resume, silent
  /// verify — never a user tapping "Sign Out") found the session already
  /// invalid server-side. Deliberately different from [logout] only in the
  /// user-facing [AuthState.sessionExpiredNotice]; progress IS cleared
  /// (Audit H7) so a subsequent guest session on a shared family device
  /// cannot inherit the prior learner's in-memory/disk progress. Server-
  /// side progress is the source of truth and is re-pulled on next sign-in.
  Future<void> _handleSessionExpired() async {
    _beginOp(); // invalidate any in-flight login/ensureSession so it can't resurrect this session
    await ApiClient.instance.clearCookies();
    final prefs = await SharedPreferences.getInstance();
    for (final key in AppConstants.authPrefKeys) {
      await prefs.remove(key);
    }
    await _ref.read(progressProvider.notifier).clearAll();
    state = const AuthState(
      isLoggedIn: false,
      isLoading: false,
      sessionExpiredNotice: 'Your session expired. Please sign in again.',
    );
    _invalidatePartScopedProviders();
  }

  /// Called by the app root after showing [AuthState.sessionExpiredNotice]
  /// so it doesn't reappear on the next rebuild.
  void consumeSessionExpiredNotice() {
    if (state.sessionExpiredNotice == null) return;
    state = state.copyWith(clearSessionExpiredNotice: true);
  }

  Future<String?> login(String email, String password) async {
    return _withExplicitAuthLock(() async {
      final gen = _beginOp();
      state = state.copyWith(isLoading: true, error: null);
      try {
        final response = await ApiClient.instance.dio.post(
          '/api/auth/signin',
          data: {'email': email.trim(), 'password': password},
        );
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true) {
          bool hasAccess = data['hasPurchase'] as bool? ?? false;
          bool isFamily = data['isFamily'] as bool? ?? false;
          String? purchasePlatform;
          try {
            final accessRes = await ApiClient.instance.dio.get(
              '/api/access/check',
            );
            hasAccess = accessRes.data['hasAccess'] as bool? ?? hasAccess;
            isFamily =
                accessRes.data['isFamily'] as bool? ??
                ((accessRes.data['planType'] as String?) == 'family') || isFamily;
            purchasePlatform = accessRes.data['purchasePlatform'] as String?;
          } catch (_) {}

          final user = UserModel(
            email: email.trim(),
            // Without this, `name` stayed null after every fresh email/password
            // sign-in (this response previously never included it at all), so
            // the dashboard greeting's `_firstName` fallback always showed
            // "Student" instead of the user's real name — even though the
            // account has always had a fullName. Mirrors the fix already
            // applied to _ensureSessionImpl() below for the guest-restore path.
            name: data['fullName'] as String?,
            hasAccess: hasAccess,
            isFamily: isFamily,
            role: data['role'] as String? ?? 'student',
            emailVerified: data['emailVerified'] as bool? ?? false,
            purchasePlatform: purchasePlatform,
          );
          // A newer auth op already committed more recent state while this
          // request was in flight — don't persist this now-stale result.
          // Deliberately checked BEFORE _saveUser(): persisting
          // `isLoggedIn=true` to disk for a login whose own Set-Cookie was
          // just discarded by the cookie-generation guard (because it lost
          // this race) would leave the device believing it's authenticated
          // with no real session cookie behind it. The explicit-auth lock
          // above makes this effectively unreachable in practice, but this
          // check stays as defense in depth.
          if (_isCurrentOp(gen)) {
            // Prefer live cookie presence over a sticky persist-fail flag from
            // an earlier unrelated write — if seerah_session is in the jar,
            // the session is usable for this process.
            if (!cookies.hasSessionCookie()) {
              state = state.copyWith(
                isLoading: false,
                error: 'Sign-in failed to save session. Please try again.',
              );
              return 'Sign-in failed to save session. Please try again.';
            }
            // Wipe the platform WebView jar so a prior guest/other account's
            // injected billing cookie can't survive an in-place login switch.
            await ApiClient.instance.clearWebViewCookies();
            await _saveUser(user);
            state = AuthState(isLoggedIn: true, isLoading: false, user: user);
            // Mirrors logout()/deleteAccount()/_handleSessionExpired() — without
            // this, signing in as a DIFFERENT account on a shared device (e.g.
            // a guest session, or a previous family member, switching to
            // someone else's real account) kept serving the PREVIOUS session's
            // cached part content, quiz data, and family profile list/progress
            // from these non-autoDispose providers until something else
            // happened to force a refresh.
            _invalidatePartScopedProviders();
            return null;
          }
          // Audit C2 fix: gen was bumped while this login's Set-Cookie was in
          // flight (e.g. a concurrent session-expiry `_beginOp`) — the cookie
          // was discarded and we must NOT report success. Returning null here
          // previously left the UI believing login worked with no session.
          return 'Sign-in was interrupted. Please try again.';
        }
        if (_isCurrentOp(gen)) {
          state = state.copyWith(
            isLoading: false,
            error: 'Login failed. Check your credentials.',
          );
        }
        return 'Login failed. Check your credentials.';
      } catch (e) {
        final msg = _parseError(e);
        if (_isCurrentOp(gen)) {
          state = state.copyWith(isLoading: false, error: msg);
        }
        return msg;
      }
    });
  }

  /// Guards concurrent callers of [ensureSession] (IAP renewal replay, a
  /// buy() tap, and app-resume can all trigger it within the same tick)
  /// into awaiting the SAME in-flight request instead of each independently
  /// POSTing to /api/auth/mobile-anonymous — without this, a burst of calls
  /// while genuinely signed-out created one orphaned duplicate guest
  /// account per extra caller.
  Future<bool>? _ensureSessionInFlight;

  /// Guarantees the caller has a session before starting a purchase, without
  /// ever asking the user for personal information (Apple Guideline
  /// 5.1.1(v)). If already signed in (real or guest), this is a no-op.
  /// Otherwise it silently provisions a device-linked guest account.
  /// Returns true if a session now exists.
  Future<bool> ensureSession() async {
    // Never trust prefs-only "logged in" without a real session cookie —
    // a failed secure-storage write after login left devices believing they
    // were authenticated with an empty Dio jar (IAP verify 401 / orphaned
    // Play purchases). Clear the phantom state and fall through to guest
    // provisioning (or wait for an in-flight explicit login).
    if (state.isLoggedIn && cookies.hasSessionCookie()) return true;
    if (state.isLoggedIn && !cookies.hasSessionCookie()) {
      await _clearPhantomLocalSession();
    }
    // Never race a user-initiated login()/upgradeAccount() that's already
    // in flight — wait for it to finish first (see _explicitAuthLock doc
    // comment), then re-check: it may well have just logged the user in,
    // making the guest-session provisioning below entirely unnecessary.
    await _awaitExplicitAuthLock();
    if (state.isLoggedIn && cookies.hasSessionCookie()) return true;
    if (state.isLoggedIn && !cookies.hasSessionCookie()) {
      await _clearPhantomLocalSession();
    }
    final inFlight = _ensureSessionInFlight;
    if (inFlight != null) return inFlight;
    final future = _ensureSessionImpl();
    _ensureSessionInFlight = future;
    try {
      return await future;
    } finally {
      if (identical(_ensureSessionInFlight, future)) {
        _ensureSessionInFlight = null;
      }
    }
  }

  /// Prefs/state said logged-in but the cookie jar is empty — drop local auth
  /// without hitting the logout API (there is no server session to clear).
  Future<void> _clearPhantomLocalSession() async {
    _beginOp();
    final prefs = await SharedPreferences.getInstance();
    for (final key in AppConstants.authPrefKeys) {
      await prefs.remove(key);
    }
    state = const AuthState(isLoggedIn: false, isLoading: false);
  }

  Future<bool> _ensureSessionImpl() async {
    final gen = _beginOp();
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient.instance.dio.post(
        '/api/auth/mobile-anonymous',
      );
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true) {
        final user = UserModel(
          // Audit M-reinstall-blank fix: /api/auth/mobile-anonymous is
          // idempotent and can silently resolve to an EXISTING REAL account
          // (e.g. its session cookie survived an app reinstall via iOS
          // Keychain persistence even though this notifier's own local
          // state didn't) — without reading these, the Profile screen would
          // show a blank name and "Student" for an otherwise fully
          // correctly-restored real account. Absent for anonymous accounts
          // (the backend omits them there on purpose).
          email: data['email'] as String?,
          name: data['fullName'] as String?,
          hasAccess: data['hasAccess'] as bool? ?? false,
          isFamily: (data['planType'] as String?) == 'family',
          role: data['role'] as String? ?? 'student',
          isAnonymous: data['isAnonymous'] as bool? ?? true,
          // Anonymous accounts never get this field back (see route doc
          // comment) — true here is intentional so they never trip a
          // "verify your email" prompt built on top of this flag.
          emailVerified:
              (data['isAnonymous'] as bool? ?? true) ? true : (data['emailVerified'] as bool? ?? false),
          purchasePlatform: data['purchasePlatform'] as String?,
        );
        // If a manual login()/upgradeAccount() completed while this
        // (automatically triggered) guest-session request was in flight, don't stomp their
        // real signed-in state back into an anonymous guest — and don't
        // persist this stale guest identity to disk either (see login()'s
        // matching comment on why _saveUser must stay inside this check).
        if (_isCurrentOp(gen)) {
          if (!cookies.hasSessionCookie()) {
            state = state.copyWith(
              isLoading: false,
              error: 'Could not start checkout. Please try again.',
            );
            return false;
          }
          await _saveUser(user);
          state = AuthState(isLoggedIn: true, isLoading: false, user: user);
          return true;
        } else if (state.isLoggedIn && cookies.hasSessionCookie()) {
          // Another op already signed the user in for real — nothing to do.
          return true;
        }
        // Audit C3 fix: gen went stale AND nobody else signed us in — the
        // guest Set-Cookie was discarded. Returning true here previously let
        // buy()/restore trust a phantom session and open Play Billing with
        // no cookie → verify 401 → orphaned purchase. Callers that only
        // check the boolean (landing/pricing/welcome) now get a hard fail.
        return false;
      }
      if (_isCurrentOp(gen)) {
        state = state.copyWith(
          isLoading: false,
          error: 'Could not start checkout. Please try again.',
        );
      }
      return false;
    } catch (e) {
      final msg = _parseError(e);
      if (_isCurrentOp(gen)) {
        state = state.copyWith(isLoading: false, error: msg);
      }
      return false;
    }
  }

  /// Fully optional upgrade of a guest account to a real email/password
  /// account — same user id, so purchases already made stay attached.
  /// Never required before or after purchase (Apple Guideline 5.1.1(v)).
  Future<UpgradeAccountResult> upgradeAccount(
    String name,
    String email,
    String password,
  ) async {
    return _withExplicitAuthLock(() async {
      final gen = _beginOp();
      state = state.copyWith(isLoading: true, error: null);
      try {
        final response = await ApiClient.instance.dio.post(
          '/api/auth/upgrade-account',
          data: {
            'fullName': name.trim(),
            'email': email.trim(),
            'password': password,
          },
        );
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true) {
          final current = state.user ?? const UserModel();
          // Re-check access/family from the server so a family purchase made as
          // a guest is reflected after the upgrade (same user id, purchase stays).
          bool hasAccess = current.hasAccess;
          bool isFamily = current.isFamily;
          String? purchasePlatform = current.purchasePlatform;
          try {
            final accessRes = await ApiClient.instance.dio.get(
              '/api/access/check',
            );
            hasAccess = accessRes.data['hasAccess'] as bool? ?? hasAccess;
            isFamily =
                accessRes.data['isFamily'] as bool? ??
                ((accessRes.data['planType'] as String?) == 'family') || isFamily;
            purchasePlatform = accessRes.data['purchasePlatform'] as String?;
          } catch (_) {}
          final requiresVerification = data['requiresVerification'] as bool? ?? false;
          final user = current.copyWith(
            email: email.trim(),
            name: name.trim(),
            isAnonymous: false,
            hasAccess: hasAccess,
            isFamily: isFamily,
            purchasePlatform: purchasePlatform,
            clearPurchasePlatform: purchasePlatform == null,
            // Trust server emailVerified. Content gates on hasAccess, not
            // emailVerified (Apple 5.1.1(v)); soft verify stays on profile.
            emailVerified: data['emailVerified'] as bool? ?? false,
          );
          if (_isCurrentOp(gen)) {
            if (!cookies.hasSessionCookie()) {
              state = state.copyWith(
                isLoading: false,
                error: 'Account created but session failed to save. Please sign in.',
              );
              return UpgradeAccountResult(
                success: false,
                error: 'Account created but session failed to save. Please sign in.',
              );
            }
            await ApiClient.instance.clearWebViewCookies();
            await _saveUser(user);
            state = state.copyWith(isLoading: false, user: user);
            return UpgradeAccountResult(
              success: true,
              requiresVerification: requiresVerification,
              verificationEmailFailed: data['verificationEmailFailed'] as bool? ?? false,
            );
          }
          // Gen discarded (cookie may have been too) — do not report success.
          return UpgradeAccountResult(
            success: false,
            error: 'Account upgrade was interrupted. Please try again.',
          );
        }
        final msg = data['error'] as String? ?? 'Could not create account.';
        if (_isCurrentOp(gen)) {
          state = state.copyWith(isLoading: false, error: msg);
        }
        return UpgradeAccountResult(success: false, error: msg);
      } on DioException catch (e) {
        final data = e.response?.data;
        final accountExists = data is Map && data['hasAccount'] == true;
        final serverMsg = data is Map ? data['error'] as String? : null;
        final msg = serverMsg ?? _parseError(e);
        if (_isCurrentOp(gen)) {
          state = state.copyWith(isLoading: false, error: msg);
        }
        return UpgradeAccountResult(
          success: false,
          error: msg,
          accountExists: accountExists,
        );
      } catch (e) {
        final msg = _parseError(e);
        if (_isCurrentOp(gen)) {
          state = state.copyWith(isLoading: false, error: msg);
        }
        return UpgradeAccountResult(success: false, error: msg);
      }
    });
  }

  /// Permanently and immediately deletes the account server-side (Apple
  /// Guideline 5.1.1(v) — apps that support account creation must also
  /// support in-app account deletion). Clears all local session state on
  /// success. Returns an error message on failure, or null on success.
  Future<String?> deleteAccount({String? password}) async {
    _beginOp(); // invalidate any in-flight login/ensureSession so it can't resurrect this session
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
        _invalidatePartScopedProviders();
        return null;
      }
      return data['error'] as String? ?? 'Could not delete account.';
    } catch (e) {
      return _parseError(e);
    }
  }

  Future<void> logout() async {
    _beginOp(); // invalidate any in-flight login/ensureSession so it can't resurrect this session
    // NOTE: the correct endpoint is /api/auth/signout (there is no
    // /api/auth/logout on the server) — calling the wrong path silently
    // failed to invalidate the server-side session on every mobile logout.
    //
    // Local state is always cleared below regardless of outcome (a flaky
    // network must never trap a user in "can't sign out" purgatory), but a
    // couple of quick retries meaningfully shrinks the window where the
    // client believes it's signed out while the server-side Session row
    // (valid up to COOKIE_MAX_AGE, 30 days) is actually still live.
    const maxAttempts = 2;
    for (var attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await ApiClient.instance.dio.post('/api/auth/signout');
        break;
      } catch (e) {
        if (attempt == maxAttempts) {
          debugPrint(
            '[AuthNotifier] signout request failed after $maxAttempts attempts: $e',
          );
        } else {
          await Future.delayed(const Duration(milliseconds: 300));
        }
      }
    }
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
    _invalidatePartScopedProviders();
  }

  Future<void> _saveUser(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(AppConstants.keyIsLoggedIn, true);
    if (user.email != null)
      await prefs.setString(AppConstants.keyUserEmail, user.email!);
    if (user.name != null)
      await prefs.setString(AppConstants.keyUserName, user.name!);
    await prefs.setBool(AppConstants.keyHasAccess, user.hasAccess);
    await prefs.setBool(AppConstants.keyIsFamily, user.isFamily);
    await prefs.setString(AppConstants.keyUserRole, user.role);
    await prefs.setBool(AppConstants.keyIsAnonymous, user.isAnonymous);
    await prefs.setBool(AppConstants.keyEmailVerified, user.emailVerified);
    if (user.purchasePlatform != null) {
      await prefs.setString(AppConstants.keyPurchasePlatform, user.purchasePlatform!);
    } else {
      await prefs.remove(AppConstants.keyPurchasePlatform);
    }
  }

  /// Audit M-resend-verify: mobile never exposed this despite the endpoint
  /// (/api/auth/resend-verification) already existing for web — a real
  /// (non-anonymous) account whose original verification email bounced,
  /// expired (24h), or was never sent (transient Resend outage) had no way
  /// to request a new one without leaving the app. Returns null on success,
  /// or an error message (e.g. rate-limited, already verified) on failure.
  Future<String?> resendVerificationEmail() async {
    try {
      final response = await ApiClient.instance.dio.post(
        '/api/auth/resend-verification',
      );
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true) return null;
      return data['error'] as String? ?? 'Could not send verification email.';
    } on DioException catch (e) {
      final data = e.response?.data;
      final serverMsg = data is Map ? data['error'] as String? : null;
      return serverMsg ?? _parseError(e);
    } catch (e) {
      return _parseError(e);
    }
  }

  String _parseError(dynamic e) {
    // Log structured fields (status code / message) instead of the raw
    // exception — a DioException's toString() can include the full request
    // (URL, headers, and body, which for auth endpoints means emails and
    // plaintext passwords) in debug console output.
    if (kDebugMode && e is DioException) {
      debugPrint(
        '[AuthNotifier] error: status=${e.response?.statusCode} message=${e.message}',
      );
    } else if (kDebugMode) {
      debugPrint('[AuthNotifier] error: ${e.runtimeType}');
    }
    try {
      final data = (e as dynamic).response?.data;
      if (data is Map)
        return data['error'] as String? ?? 'Something went wrong.';
    } catch (_) {}
    return 'Something went wrong. Please try again.';
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});
