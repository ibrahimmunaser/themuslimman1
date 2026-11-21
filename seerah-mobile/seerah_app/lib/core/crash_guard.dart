import 'package:shared_preferences/shared_preferences.dart';

import 'providers/part_provider.dart' show courseLangPrefsKey;

/// Breaks an otherwise-permanent "the app crashes on every launch" loop.
///
/// This app has no crash-reporting SDK wired up yet, so a hard crash that
/// happens before the first frame ever renders (no error screen, nothing
/// for the user to tap, nothing for us to inspect after the fact) leaves
/// the user with no way to recover short of deleting and reinstalling the
/// app — which is exactly what happened when a user switched the in-app
/// language to Arabic and the app then failed to open again at all.
///
/// We don't know the exact root cause of that one yet (no device logs to
/// go on), but we can still make the failure recoverable: [markPending] is
/// set at the very top of `main()`, before anything else runs, and
/// [markSucceeded] clears it once the first frame has actually rendered.
/// If a launch starts with the *previous* launch's flag still set — i.e.
/// that launch never made it to a first frame — two such launches in a
/// row reset the persisted in-app language back to English, since that's
/// the one variable we know correlates with this failure. It's a safety
/// net for this and any future startup crash that happens to be
/// language-shaped, not a fix for the specific bug.
class CrashGuard {
  CrashGuard._();

  static const _pendingKey = 'crash_guard_launch_pending';
  static const _streakKey = 'crash_guard_fail_streak';

  /// Two unfinished launches in a row before we intervene — one crash
  /// could just be a fluke (killed from the app switcher mid-launch,
  /// etc.); two in a row strongly suggests something is reliably broken.
  static const _resetThreshold = 2;

  /// True for the remainder of this process after [checkAndMarkPending]
  /// performed a language reset — read it once (e.g. right after
  /// `runApp`) to tell the user what happened, then ignore it.
  static bool justRecoveredLanguage = false;

  /// Call at the very top of `main()`, before any other async work,
  /// and before anything reads `courseLangProvider`.
  static Future<void> checkAndMarkPending() async {
    final prefs = await SharedPreferences.getInstance();
    final previousLaunchNeverFinished = prefs.getBool(_pendingKey) ?? false;

    if (previousLaunchNeverFinished) {
      final streak = (prefs.getInt(_streakKey) ?? 0) + 1;
      await prefs.setInt(_streakKey, streak);
      if (streak >= _resetThreshold) {
        final lang = prefs.getString(courseLangPrefsKey);
        if (lang != null && lang != 'en') {
          await prefs.remove(courseLangPrefsKey);
          justRecoveredLanguage = true;
        }
        await prefs.setInt(_streakKey, 0);
      }
    } else {
      await prefs.setInt(_streakKey, 0);
    }

    await prefs.setBool(_pendingKey, true);
  }

  /// Call once the first frame has actually rendered (see the
  /// post-frame callback in `main.dart`'s root widget).
  static Future<void> markSucceeded() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_pendingKey, false);
  }
}
