import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// App-wide last-resort error capture.
///
/// Before this existed the app had no global handlers at all, so an
/// uncaught exception in an async callback, a platform channel or the
/// framework itself left no trace anywhere (see the unexplained "closes
/// right after opening in Arabic" report). [install] hooks every uncaught
/// error channel Flutter exposes, keeps the most recent entries in
/// SharedPreferences (so they survive a crash and can be read on the next
/// launch via [recent]), and — importantly — never rethrows, so one bad
/// callback can no longer take the whole app down.
///
/// This is deliberately local-only: no third-party SDK or network call is
/// involved. [onReport] is the single seam to forward entries to a crash
/// service (Sentry, Crashlytics, an own endpoint) once one is chosen.
class ErrorReporter {
  ErrorReporter._();

  static const _prefsKey = 'error_reporter_recent';
  static const maxEntries = 20;
  static const _maxFieldLength = 1500;

  /// Optional sink for a future crash-reporting backend. Must not throw;
  /// any exception it raises is swallowed.
  static void Function(Map<String, Object?> entry)? onReport;

  static bool _installed = false;
  static final List<Map<String, Object?>> _buffer = [];
  static Future<void>? _writing;

  /// Installs the global handlers. Idempotent.
  static void install() {
    if (_installed) return;
    _installed = true;

    final previousFlutterHandler = FlutterError.onError;
    FlutterError.onError = (FlutterErrorDetails details) {
      // Keep Flutter's default behaviour (console dump in debug builds).
      if (previousFlutterHandler != null) {
        previousFlutterHandler(details);
      } else {
        FlutterError.presentError(details);
      }
      report(details.exception, details.stack, source: 'flutter');
    };

    // Errors that escape every zone/Future: platform channels, isolates,
    // un-awaited futures. Returning true marks them handled (no crash).
    PlatformDispatcher.instance.onError = (Object error, StackTrace stack) {
      report(error, stack, source: 'platform');
      return true;
    };
  }

  /// Records an error. Safe to call from anywhere; never throws.
  static void report(
    Object error,
    StackTrace? stack, {
    String source = 'manual',
  }) {
    try {
      final entry = <String, Object?>{
        'time': DateTime.now().toUtc().toIso8601String(),
        'source': source,
        'error': _clip(error.toString()),
        'stack': _clip(stack?.toString() ?? ''),
      };
      debugPrint('[ErrorReporter][$source] $error');
      _buffer.add(entry);
      if (_buffer.length > maxEntries) {
        _buffer.removeRange(0, _buffer.length - maxEntries);
      }
      try {
        onReport?.call(entry);
      } catch (_) {}
      _persist();
    } catch (_) {
      // Reporting must never be the thing that crashes the app.
    }
  }

  /// Runs [action]; on failure records it and returns [fallback] instead of
  /// propagating. Used for independent startup steps so one failing step
  /// (secure storage, prefs, …) degrades gracefully instead of aborting
  /// `main()` before `runApp`.
  static Future<T> guard<T>(
    String label,
    Future<T> Function() action,
    T fallback,
  ) async {
    try {
      return await action();
    } catch (e, st) {
      report(e, st, source: 'startup:$label');
      return fallback;
    }
  }

  /// Entries captured by previous launches plus this one (oldest first).
  static Future<List<Map<String, Object?>>> recent() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_prefsKey);
      if (raw == null) return const [];
      final decoded = jsonDecode(raw);
      if (decoded is! List) return const [];
      return [
        for (final e in decoded)
          if (e is Map) Map<String, Object?>.from(e),
      ];
    } catch (_) {
      return const [];
    }
  }

  /// Plain-text summary of [recent] (error text + top stack frames only,
  /// no user data) for pasting into a support message.
  static Future<String> formatReport({String? appVersion}) async {
    final entries = await recent();
    final b = StringBuffer('The Muslim Man — error report');
    if (appVersion != null) b.write(' (v$appVersion)');
    b.writeln();
    if (entries.isEmpty) {
      b.writeln('No uncaught errors recorded.');
      return b.toString();
    }
    for (final e in entries) {
      b.writeln('[${e['time']}] ${e['source']}: ${e['error']}');
      final frames = (e['stack'] as String? ?? '')
          .split('\n')
          .where((l) => l.trim().isNotEmpty)
          .take(3);
      for (final f in frames) {
        b.writeln('    $f');
      }
    }
    return b.toString();
  }

  static String _clip(String s) => s.length <= _maxFieldLength
      ? s
      : '${s.substring(0, _maxFieldLength)}…[truncated]';

  static void _persist() {
    // Serialise writes so a burst of errors can't interleave.
    final previous = _writing ?? Future<void>.value();
    _writing = previous.then((_) async {
      try {
        final prefs = await SharedPreferences.getInstance();
        final existing = await recent();
        final merged = [...existing, ..._buffer];
        // _buffer holds this launch's entries; avoid duplicating them on
        // later writes by only keeping the tail and then clearing nothing —
        // de-dupe on (time, error).
        final seen = <String>{};
        final unique = <Map<String, Object?>>[];
        for (final e in merged) {
          if (seen.add('${e['time']}|${e['error']}')) unique.add(e);
        }
        final trimmed = unique.length > maxEntries
            ? unique.sublist(unique.length - maxEntries)
            : unique;
        await prefs.setString(_prefsKey, jsonEncode(trimmed));
      } catch (_) {}
    });
  }
}
