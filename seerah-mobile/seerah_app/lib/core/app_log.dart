import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

enum _Level { info, warn, error }

/// Thin, never-throwing wrapper over Sentry Structured Logs.
///
/// Logs are searchable in Sentry (Explore > Logs), shown alongside the errors
/// they precede, and carry release / device / user attributes automatically.
/// We use them for *context that errors alone don't give us* — did the
/// reminders actually get scheduled, was exact-alarm permission available,
/// which screen opened, did a request fail — i.e. the "why didn't my
/// notification fire" questions that otherwise need a device in hand.
///
/// Conventions (see https://docs.sentry.io/platforms/dart/guides/flutter/logs/):
/// * one "wide" log per operation, not a trail of thin ones;
/// * `snake_case` attribute names;
/// * no personal data — never log names of du'a people, coordinates, or
///   anything the user typed. Counts, enums, booleans and ids only.
///
/// Debug builds only print locally; nothing is sent from `flutter run`.
class AppLog {
  AppLog._();

  static void info(String message, [Map<String, Object?> attrs = const {}]) =>
      _send(_Level.info, message, attrs);

  static void warn(String message, [Map<String, Object?> attrs = const {}]) =>
      _send(_Level.warn, message, attrs);

  static void error(String message, [Map<String, Object?> attrs = const {}]) =>
      _send(_Level.error, message, attrs);

  static void _send(
    _Level level,
    String message,
    Map<String, Object?> attrs,
  ) {
    try {
      if (kDebugMode) {
        debugPrint('[AppLog][${level.name}] $message $attrs');
        return;
      }
      final attributes = <String, SentryAttribute>{
        for (final e in attrs.entries)
          if (e.value != null) e.key: _attr(e.value!),
      };
      switch (level) {
        case _Level.warn:
          Sentry.logger.warn(message, attributes: attributes);
        case _Level.error:
          Sentry.logger.error(message, attributes: attributes);
        case _Level.info:
          Sentry.logger.info(message, attributes: attributes);
      }
    } catch (_) {
      // Logging must never be the thing that breaks the app.
    }
  }

  static SentryAttribute _attr(Object value) {
    if (value is bool) return SentryAttribute.bool(value);
    if (value is int) return SentryAttribute.int(value);
    if (value is double) return SentryAttribute.double(value);
    return SentryAttribute.string(value.toString());
  }
}
