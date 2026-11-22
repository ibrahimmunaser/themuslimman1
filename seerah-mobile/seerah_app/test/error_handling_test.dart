import 'package:flutter_test/flutter_test.dart';
import 'package:seerah_app/core/crash_guard.dart';
import 'package:seerah_app/core/error_reporter.dart';
import 'package:seerah_app/core/providers/part_provider.dart'
    show courseLangPrefsKey;
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ErrorReporter.guard', () {
    setUp(() => SharedPreferences.setMockInitialValues({}));

    test('returns the action result when it succeeds', () async {
      final v = await ErrorReporter.guard('ok', () async => 42, 0);
      expect(v, 42);
    });

    test('returns the fallback instead of throwing when it fails', () async {
      final v = await ErrorReporter.guard<int>(
        'boom',
        () async => throw StateError('nope'),
        7,
      );
      expect(v, 7);
    });

    test('forwards failures to onReport and never rethrows from it', () async {
      final seen = <Map<String, Object?>>[];
      ErrorReporter.onReport = (error, stack, entry) {
        seen.add(entry);
        throw StateError('sink is broken');
      };
      addTearDown(() => ErrorReporter.onReport = null);

      ErrorReporter.report(Exception('x'), StackTrace.current, source: 't');
      expect(seen, hasLength(1));
      expect(seen.single['source'], 't');
      expect(seen.single['error'], contains('x'));
    });

    test('persists recent entries and caps them', () async {
      for (var i = 0; i < ErrorReporter.maxEntries + 5; i++) {
        ErrorReporter.report(Exception('e$i'), null);
      }
      // Let the serialised write chain drain.
      await Future<void>.delayed(const Duration(milliseconds: 300));
      final recent = await ErrorReporter.recent();
      expect(recent.length, lessThanOrEqualTo(ErrorReporter.maxEntries));
      expect(recent.last['error'], contains('e${ErrorReporter.maxEntries + 4}'));
    });
  });

  group('CrashGuard', () {
    test('two unfinished launches in a row reset a non-English language',
        () async {
      SharedPreferences.setMockInitialValues({
        courseLangPrefsKey: 'ar',
        'crash_guard_launch_pending': true,
        'crash_guard_fail_streak': 1,
      });
      CrashGuard.justRecoveredLanguage = false;

      await CrashGuard.checkAndMarkPending();

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString(courseLangPrefsKey), isNull);
      expect(CrashGuard.justRecoveredLanguage, isTrue);
    });

    test('a single unfinished launch does not reset the language', () async {
      SharedPreferences.setMockInitialValues({
        courseLangPrefsKey: 'ar',
        'crash_guard_launch_pending': true,
      });
      CrashGuard.justRecoveredLanguage = false;

      await CrashGuard.checkAndMarkPending();

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString(courseLangPrefsKey), 'ar');
      expect(CrashGuard.justRecoveredLanguage, isFalse);
    });

    test('markSucceeded clears the pending flag', () async {
      SharedPreferences.setMockInitialValues({});
      await CrashGuard.checkAndMarkPending();
      await CrashGuard.markSucceeded();
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('crash_guard_launch_pending'), isFalse);
    });
  });
}
