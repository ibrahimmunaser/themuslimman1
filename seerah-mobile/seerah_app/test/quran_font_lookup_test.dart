import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:seerah_app/features/salah/models/prayer_settings.dart';
import 'package:seerah_app/features/salah/utils/quran_fonts.dart';

/// Regression: the Quran reader built before main.dart mounted the
/// AppController provider threw ProviderNotFoundException (Sentry
/// SEERAH-MOBILE-8/3).
void main() {
  testWidgets('watchQuranFont falls back to the default with no provider', (
    tester,
  ) async {
    QuranFontOption? seen;
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) {
            seen = watchQuranFont(context);
            return const SizedBox();
          },
        ),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(seen, const PrayerSettings().quranFont);
  });

  testWidgets('nullable select finds a non-nullable ChangeNotifierProvider', (
    tester,
  ) async {
    // watchQuranFont relies on `select<AppController?, …>` resolving the
    // provider that main.dart mounts as ChangeNotifierProvider<AppController>
    // (non-nullable). Verified here with a stand-in notifier.
    final notifier = _Counter()..value = 7;
    int? seen;
    await tester.pumpWidget(
      ChangeNotifierProvider<_Counter>.value(
        value: notifier,
        child: MaterialApp(
          home: Builder(
            builder: (context) {
              seen = context.select<_Counter?, int?>((c) => c?.value);
              return const SizedBox();
            },
          ),
        ),
      ),
    );
    expect(seen, 7);
    notifier
      ..value = 9
      ..notifyListeners();
    await tester.pump();
    expect(seen, 9);
  });

  testWidgets('nullable provider lookup does not throw when absent', (
    tester,
  ) async {
    late Object? value;
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) {
            value = context.read<ChangeNotifier?>();
            return const SizedBox();
          },
        ),
      ),
    );
    expect(value, isNull);
  });
}

class _Counter extends ChangeNotifier {
  int value = 0;
}
