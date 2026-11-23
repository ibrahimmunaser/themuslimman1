import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart' show PlatformException;
import 'package:http/http.dart' as http;
import 'package:sentry_flutter/sentry_flutter.dart';

/// True for failures that are just "the user's network (or the remote
/// media) was unavailable" rather than a bug in the app.
///
/// These dominated the Sentry feed — connection resets and TLS handshake
/// drops (SEERAH-MOBILE-B/C/D/K/R/M), the 20 s Quran API timeouts
/// (SEERAH-MOBILE-6/7/H), google_fonts failing to download a typeface on a
/// flaky connection (SEERAH-MOBILE-5, hundreds of events from one bad
/// network), and audioplayers failing to open a remote recitation while
/// offline (SEERAH-MOBILE-A/N). Every one already degrades gracefully in the
/// UI (cached/fallback font, error + retry state, audio stops), and none is
/// actionable, so reporting them only buries real crashes.
bool isTransientNetworkError(Object? error) {
  if (error == null) return false;
  if (error is SocketException ||
      error is HandshakeException ||
      error is TlsException ||
      error is TimeoutException ||
      error is http.ClientException) {
    return true;
  }
  if (error is PlatformException && error.code == 'AndroidAudioError') {
    return true;
  }
  return _looksLikeNetworkNoise(error.toString());
}

bool _looksLikeNetworkNoise(String text) {
  return text.contains('Failed to load font with url') ||
      text.contains('Connection reset by peer') ||
      text.contains('Connection terminated during handshake') ||
      text.contains('No address associated with hostname') ||
      text.contains('MEDIA_ERROR_');
}

/// Sentry `beforeSend` hook: drops [isTransientNetworkError] events.
///
/// Matches on the original throwable when we have it, and on the serialized
/// exception text otherwise (events re-created from platform channels or
/// chained causes — e.g. the bare "OSError: Connection reset by peer" that
/// Sentry splits out of a SocketException — carry no throwable).
SentryEvent? dropTransientNetworkNoise(SentryEvent event, Hint hint) {
  if (isTransientNetworkError(event.throwable)) return null;
  final exceptions = event.exceptions ?? const <SentryException>[];
  for (final e in exceptions) {
    if (_looksLikeNetworkNoise('${e.type} ${e.value}')) return null;
  }
  return event;
}
