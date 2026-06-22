import 'dart:convert';
import 'package:dio/dio.dart';
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
  aOptions: AndroidOptions(encryptedSharedPreferences: true),
  iOptions: IOSOptions(
    accessibility: KeychainAccessibility.first_unlock_this_device,
  ),
);

// ── In-memory cookie map (name → value, single-origin: themuslimman.com) ─────
// Populated from secure storage on init and kept in sync on every response.
Map<String, String> _mem = {};

// ─────────────────────────────────────────────────────────────────────────────
// Public API (matches the stub and is called by ApiClient)
// ─────────────────────────────────────────────────────────────────────────────

Future<void> attachCookies(Dio dio) async {
  await _load();
  dio.interceptors.add(_SecureCookieInterceptor());
}

Future<void> clearAllCookies() async {
  _mem.clear();
  await _store.delete(key: _kStorageKey);
}

/// Returns a copy of the current in-memory cookie map for injection into WebView.
Map<String, String> getCurrentCookies() => Map.unmodifiable(_mem);

// ── Persistence helpers ───────────────────────────────────────────────────────

/// Reads the JSON cookie blob from secure storage into [_mem].
Future<void> _load() async {
  try {
    final raw = await _store.read(key: _kStorageKey);
    if (raw != null && raw.isNotEmpty) {
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      _mem = decoded.map((k, v) => MapEntry(k, v as String));
    }
  } catch (_) {
    // Corrupted or missing data: start fresh.
    _mem = {};
  }
}

/// Persists [_mem] to secure storage as a JSON blob.
/// Fire-and-forget: errors are swallowed so they never block the request flow.
void _persist() {
  _store
      .write(key: _kStorageKey, value: jsonEncode(_mem))
      .catchError((_) {});
}

// ── Interceptor ───────────────────────────────────────────────────────────────

class _SecureCookieInterceptor extends Interceptor {
  /// Attach stored cookies to every outgoing request.
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (_mem.isNotEmpty) {
      options.headers['Cookie'] =
          _mem.entries.map((e) => '${e.key}=${e.value}').join('; ');
    }
    handler.next(options);
  }

  /// Ingest Set-Cookie headers from successful responses.
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    _ingestSetCookie(response.headers);
    handler.next(response);
  }

  /// Ingest Set-Cookie headers from error responses (e.g. 401 logout clears
  /// session cookie via Max-Age=0 on the server side).
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response != null) _ingestSetCookie(err.response!.headers);
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

  void _ingestSetCookie(Headers headers) {
    final values = headers['set-cookie'];
    if (values == null || values.isEmpty) return;

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

    if (changed) _persist();
  }
}
