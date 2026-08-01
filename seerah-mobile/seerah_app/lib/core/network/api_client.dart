import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../constants/app_constants.dart';
import 'cookie_helper.dart' as cookies;

class ApiClient {
  static ApiClient? _instance;
  late final Dio dio;

  ApiClient._();

  static ApiClient get instance {
    _instance ??= ApiClient._();
    return _instance!;
  }

  Future<void> init() async {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 30),
        // Without this, a request with a body (e.g. a large flashcard/quiz
        // answer payload) that stalls mid-upload on a poor connection —
        // common on Android's much wider spread of real-world cellular/OEM
        // network stacks — could hang indefinitely; connectTimeout only
        // covers the initial handshake and receiveTimeout only covers
        // waiting for the response.
        sendTimeout: const Duration(seconds: 20),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        followRedirects: true,
        maxRedirects: 5,
      ),
    );

    // Attach persistent cookie manager on iOS/Android; web uses browser cookies.
    await cookies.attachCookies(dio);
  }

  Future<void> clearCookies() async {
    await cookies.clearAllCookies();
    await clearWebViewCookies();
  }

  /// Clears only the platform WebView cookie jar (Android CookieManager /
  /// iOS WKWebsiteDataStore). Used on in-place login switches where the Dio
  /// jar is replaced by Set-Cookie but the WebView jar still holds the
  /// previous account's session from a billing inject.
  Future<void> clearWebViewCookies() async {
    try {
      await WebViewCookieManager().clearCookies();
    } catch (e) {
      debugPrint('[ApiClient] WebViewCookieManager.clearCookies failed: $e');
    }
  }

  /// Advances the cookie jar's generation counter — see cookie_helper_native
  /// for why (guards against a stale in-flight request's Set-Cookie response
  /// overwriting a newer login/logout's cookie state). Called from
  /// AuthNotifier._beginOp() so every state-changing auth operation
  /// automatically invalidates older in-flight requests' cookie writes,
  /// exactly like it already does for provider state via _opGeneration.
  void bumpCookieGeneration() {
    cookies.bumpGeneration();
  }
}
