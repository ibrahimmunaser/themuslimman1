import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// ── Storage key ───────────────────────────────────────────────────────────────
// Versioned key so a future schema change can cleanly invalidate old data.
const _kStorageKey = 'secure_session_cookies_v1';

// ── Singleton secure-storage instance ────────────────────────────────────────
// Android: EncryptedSharedPreferences → Android Keystore-backed AES-256.
// iOS:     Keychain with kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
//          (accessible after first device unlock; NOT synced to iCloud; NOT
//          accessible on other devices — correct for session tokens).
final _store = const FlutterSecureStorage(
  // resetOnError: a corrupted/orphaned EncryptedSharedPreferences entry
  // (Android Keystore key gone missing — e.g. after an OS upgrade that
  // resets the keystore, or a SharedPreferences file restored via Google's
  // Auto Backup/D2D device transfer onto a NEW physical device whose
  // Keystore never had the original AES key) throws BadPaddingException on
  // every read/write attempt on plugin versions <10.0.0, where this
  // defaults to false. Without it, _load()/_persist() below silently and
  // PERMANENTLY swallow that error on every cold start forever instead of
  // self-healing by wiping the unreadable entry so a fresh login can write
  // a clean one.
  aOptions: AndroidOptions(encryptedSharedPreferences: true, resetOnError: true),
  iOptions: IOSOptions(
    accessibility: KeychainAccessibility.first_unlock_this_device,
  ),
);

// ── In-memory cookie map (name → value, single-origin: themuslimman.com) ─────
// Populated from secure storage on init and kept in sync on every response.
Map<String, String> _mem = {};

// ── Generation counter — guards against cross-session cookie races ──────────
// Mirrors AuthNotifier's _opGeneration (auth_provider.dart): bumped by
// bumpGeneration() at the start of every state-changing auth operation
// (login, logout, ensureSession, session-expiry, delete-account). Each
// outgoing request captures the generation active when it was SENT; if its
// response arrives after a newer generation has already started, its
// Set-Cookie headers are discarded instead of applied.
//
// Without this, a slow request fired just before a logout/login boundary
// (e.g. a content fetch still in flight for account A when account B signs
// in on the same shared device, or a stale request racing a "Sign Out" tap)
// could have its response processed AFTER the new session's cookie was
// already stored — silently overwriting B's fresh cookie with A's stale one
// (or reviving a just-cleared session after logout), with no error surfaced
// anywhere since this all happens inside a background interceptor.
int _generation = 0;

void bumpGeneration() => _generation++;

// ─────────────────────────────────────────────────────────────────────────────
// Public API (matches the stub and is called by ApiClient)
// ─────────────────────────────────────────────────────────────────────────────

Future<void> attachCookies(Dio dio) async {
  await _load();
  dio.interceptors.add(_SecureCookieInterceptor());
}

Future<void> clearAllCookies() async {
  bumpGeneration();
  _mem.clear();
  try {
    await _store.delete(key: _kStorageKey);
  } catch (e) {
    // Never abort logout/session-expiry because Keystore delete failed —
    // memory is already cleared; a failed delete is preferable to leaving
    // prefs isLoggedIn=true with a half-cleared jar.
    debugPrint('[cookie_helper] secure storage delete failed: $e');
  }
  _persistFailed = false;
}

/// Returns a copy of the current in-memory cookie map for injection into WebView.
Map<String, String> getCurrentCookies() => Map.unmodifiable(_mem);

/// True when the in-memory jar holds a non-empty session cookie.
/// Callers (AuthNotifier.ensureSession / login) use this to detect a
/// "prefs say logged in but secure-storage write failed" phantom session.
bool hasSessionCookie() {
  final v = _mem['seerah_session'];
  return v != null && v.isNotEmpty;
}

/// True if the most recent [_persist] attempt failed. Cleared on success.
bool lastCookiePersistFailed() => _persistFailed;

bool _persistFailed = false;

// ── Persistence helpers ───────────────────────────────────────────────────────

/// Reads the JSON cookie blob from secure storage into [_mem].
Future<void> _load() async {
  try {
    final raw = await _store.read(key: _kStorageKey);
    if (raw != null && raw.isNotEmpty) {
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      _mem = decoded.map((k, v) => MapEntry(k, v as String));
    }
  } catch (e) {
    // A genuine read failure (vs. simply no data yet, which never reaches
    // this catch) most likely means an unreadable/corrupted Keystore entry
    // — logged so this is distinguishable from an ordinary "never logged
    // in" cold start if this ever needs to be measured from device logs.
    debugPrint('[cookie_helper] secure storage read failed, starting fresh: $e');
    _mem = {};
  }
}

/// Persists [_mem] to secure storage as a JSON blob. Failures are tracked via
/// [_persistFailed] so AuthNotifier can refuse to mark the user logged-in when
/// the session cookie never made it to disk (previously a silent debugPrint
/// left prefs `isLoggedIn=true` with an empty jar after cold start).
Future<void> _persist() async {
  try {
    await _store.write(key: _kStorageKey, value: jsonEncode(_mem));
    _persistFailed = false;
  } catch (e) {
    _persistFailed = true;
    debugPrint('[cookie_helper] secure storage write failed: $e');
  }
}

// ── Interceptor ───────────────────────────────────────────────────────────────

const _kGenExtraKey = '_cookieGen';

class _SecureCookieInterceptor extends Interceptor {
  /// Attach stored cookies to every outgoing request, and stamp the
  /// generation active at send-time so the response handlers below can
  /// detect if a login/logout/session-expiry happened while this request
  /// was in flight.
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (_mem.isNotEmpty) {
      options.headers['Cookie'] = _mem.entries
          .map((e) => '${e.key}=${e.value}')
          .join('; ');
    }
    options.extra[_kGenExtraKey] = _generation;
    handler.next(options);
  }

  /// Ingest Set-Cookie headers from successful responses. Awaited (this is
  /// an intentional "async void" override — Dio's Interceptor doesn't await
  /// it either, but the response is only handed back to the original caller
  /// via handler.next() once the underlying secure-storage write actually
  /// completes, per _persist()'s doc comment.
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) async {
    await _ingestSetCookie(response.headers, response.requestOptions);
    handler.next(response);
  }

  /// Ingest Set-Cookie headers from error responses (e.g. 401 logout clears
  /// session cookie via Max-Age=0 on the server side).
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response != null) {
      await _ingestSetCookie(err.response!.headers, err.requestOptions);
    }
    handler.next(err);
  }

  // ── Set-Cookie parser ───────────────────────────────────────────────────────
  //
  // Each value in the `set-cookie` header list looks like:
  //   __Secure-next-auth.session-token=<jwt>; Path=/; HttpOnly; Secure;
  //   SameSite=Lax; Expires=Sat, 28 Jun 2026 05:53:28 GMT; Max-Age=2592000
  //
  // Deletion cookies (from logout) look like:
  //   __Secure-next-auth.session-token=; Path=/; Max-Age=0; HttpOnly; ...

  Future<void> _ingestSetCookie(Headers headers, RequestOptions requestOptions) async {
    final values = headers['set-cookie'];
    if (values == null || values.isEmpty) return;

    // This response belongs to a request sent under an OLDER generation —
    // a login/logout/session-expiry has happened since it was fired, so
    // whatever cookie state it's carrying is stale and must not overwrite
    // whatever the newer operation already established.
    final requestGen = requestOptions.extra[_kGenExtraKey] as int?;
    if (requestGen != null && requestGen != _generation) {
      return;
    }

    bool changed = false;

    for (final line in values) {
      final parts = line.split(';');
      if (parts.isEmpty) continue;

      final nameVal = parts.first.trim();
      final eq = nameVal.indexOf('=');
      if (eq < 0) continue;

      final name = nameVal.substring(0, eq).trim();
      final value = nameVal.substring(eq + 1).trim();
      if (name.isEmpty) continue;

      // Determine if this is a deletion directive.
      bool deleteCookie = value.isEmpty;
      for (int i = 1; i < parts.length && !deleteCookie; i++) {
        final attr = parts[i].trim().toLowerCase();
        if (attr.startsWith('max-age=')) {
          final age = int.tryParse(attr.substring(8)) ?? 1;
          if (age <= 0) deleteCookie = true;
        }
      }

      if (deleteCookie) {
        _mem.remove(name);
      } else {
        _mem[name] = value;
      }
      changed = true;
    }

    if (changed) await _persist();
  }
}
