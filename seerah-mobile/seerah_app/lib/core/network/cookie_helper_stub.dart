import 'package:dio/dio.dart';

// Web stub: browser handles cookies natively, no Dio interceptor needed.
Future<void> attachCookies(Dio dio) async {}
Future<void> clearAllCookies() async {}
Map<String, String> getCurrentCookies() => {};
bool hasSessionCookie() => true; // browser jar is authoritative on web
bool lastCookiePersistFailed() => false;
// No-op on web — the browser's own cookie jar has no equivalent race (each
// fetch/XHR call is bound to the document's live cookie store directly, not
// buffered through app-controlled in-memory state). Kept so callers (e.g.
// AuthNotifier._beginOp()) don't need platform branching.
void bumpGeneration() {}
