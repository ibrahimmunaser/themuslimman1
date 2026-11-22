import 'package:flutter_test/flutter_test.dart';
import 'package:seerah_app/features/salah/models/prayer_settings.dart';
import 'package:seerah_app/features/salah/models/salah_prayer.dart';
import 'package:seerah_app/features/salah/services/prayer_time_service.dart';
import 'package:seerah_app/features/salah/services/timezone_service.dart';
import 'package:timezone/timezone.dart' as tz;

PrayerSettings _city(
  double lat,
  double lng,
  String zone, {
  CalculationMethodOption method = CalculationMethodOption.isna,
}) => PrayerSettings(
  latitude: lat,
  longitude: lng,
  timezone: zone,
  calculationMethod: method,
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  TimezoneService.ensureInitialized();
  final service = PrayerTimeService();

  group('Duha', () {
    test('starts 20 min after sunrise and ends 10 min before Dhuhr', () {
      final s = _city(40.7128, -74.0060, 'America/New_York');
      final date = DateTime(2026, 1, 15);
      final day = service.calculateForDate(s, date);
      final duha = service.duhaFor(s, day)!;

      final dhuhr = day.timeFor(SalahPrayer.dhuhr);
      expect(
        dhuhr.difference(duha.end),
        PrayerTimeService.duhaEndBeforeDhuhr,
      );
      // Sunrise is between Fajr and Dhuhr, so Duha starts after Fajr.
      expect(duha.start.isAfter(day.timeFor(SalahPrayer.fajr)), isTrue);
      expect(duha.start.isBefore(duha.end), isTrue);

      // NYC mid-January: sunrise ≈ 7:19 → Duha ≈ 7:39, Dhuhr ≈ 12:00.
      expect(duha.start.hour, 7);
      expect(duha.start.minute, inInclusiveRange(30, 50));
      expect(duha.end.hour, 11);
    });

    test('window is several hours long in every season at mid latitudes', () {
      final s = _city(51.5074, -0.1278, 'Europe/London');
      for (final d in [
        DateTime(2026, 3, 20),
        DateTime(2026, 6, 21),
        DateTime(2026, 9, 22),
        DateTime(2026, 12, 21),
      ]) {
        final duha = service.duhaFor(s, service.calculateForDate(s, d))!;
        expect(duha.end.difference(duha.start).inMinutes, greaterThan(180));
      }
    });
  });

  group('Qiyam', () {
    test('last third starts 2/3 of the way from Maghrib to next Fajr', () {
      final s = _city(40.7128, -74.0060, 'America/New_York');
      final date = DateTime(2026, 1, 15);
      final q = service.qiyamForNight(s, date)!;

      final maghrib = service.calculateForDate(s, date).timeFor(
        SalahPrayer.maghrib,
      );
      final fajrNext = service
          .calculateForDate(s, DateTime(2026, 1, 16))
          .timeFor(SalahPrayer.fajr);
      final night = fajrNext.difference(maghrib);

      expect(q.end, fajrNext);
      expect(
        q.start.difference(maghrib).inSeconds,
        closeTo(night.inSeconds * 2 / 3, 60),
      );
      expect(
        q.midnight.difference(maghrib).inSeconds,
        closeTo(night.inSeconds / 2, 60),
      );
      // Sanity vs. published NYC timetables: last third ≈ 1:30 AM.
      expect(q.start.day, 16);
      expect(q.start.hour, 1);
      expect(q.start.minute, inInclusiveRange(15, 50));
    });

    test('is always after the Islamic midnight and before Fajr', () {
      final cities = <(PrayerSettings, String)>[
        (
          _city(
            21.4225,
            39.8262,
            'Asia/Riyadh',
            method: CalculationMethodOption.ummAlQura,
          ),
          'Makkah',
        ),
        (_city(-33.8688, 151.2093, 'Australia/Sydney'), 'Sydney'),
        (_city(41.0082, 28.9784, 'Europe/Istanbul'), 'Istanbul'),
        (_city(-6.2088, 106.8456, 'Asia/Jakarta'), 'Jakarta'),
        (_city(24.8607, 67.0011, 'Asia/Karachi'), 'Karachi'),
      ];
      for (final (settings, name) in cities) {
        for (var month = 1; month <= 12; month++) {
          final q = service.qiyamForNight(settings, DateTime(2026, month, 10));
          expect(q, isNotNull, reason: '$name month $month');
          expect(q!.midnight.isBefore(q.start), isTrue, reason: name);
          expect(q.start.isBefore(q.end), isTrue, reason: name);
        }
      }
    });
  });

  group('voluntaryTimes', () {
    test('after midnight still reports tonight\'s window, until Fajr', () {
      final s = _city(40.7128, -74.0060, 'America/New_York');
      final loc = tz.getLocation('America/New_York');
      final twoAm = tz.TZDateTime(loc, 2026, 1, 16, 2, 0);
      final v = service.voluntaryTimes(s, now: twoAm);

      expect(v.hasQiyam, isTrue);
      expect(v.isQiyamNow(twoAm), isTrue);
      expect(v.qiyamEnd!.isAfter(twoAm), isTrue);
      expect(v.qiyamStart!.isBefore(twoAm), isTrue);
    });

    test('after Fajr rolls over to the coming night', () {
      final s = _city(40.7128, -74.0060, 'America/New_York');
      final loc = tz.getLocation('America/New_York');
      final noon = tz.TZDateTime(loc, 2026, 1, 16, 12, 0);
      final v = service.voluntaryTimes(s, now: noon);

      expect(v.hasQiyam, isTrue);
      expect(v.isQiyamNow(noon), isFalse);
      expect(v.qiyamStart!.isAfter(noon), isTrue);
      expect(v.qiyamStart!.day, 17); // last third falls after midnight
    });

    test('extreme latitude never throws or returns an unordered window', () {
      // Tromsø around the midnight sun: values may be unavailable, but must
      // never be bogus.
      final s = _city(69.6492, 18.9553, 'Europe/Oslo');
      final loc = tz.getLocation('Europe/Oslo');
      for (final d in [
        tz.TZDateTime(loc, 2026, 6, 21, 12),
        tz.TZDateTime(loc, 2026, 12, 21, 12),
        tz.TZDateTime(loc, 2026, 3, 20, 12),
      ]) {
        final v = service.voluntaryTimes(s, now: d);
        if (v.hasDuha) expect(v.duhaStart!.isBefore(v.duhaEnd!), isTrue);
        if (v.hasQiyam) {
          expect(v.qiyamStart!.isBefore(v.qiyamEnd!), isTrue);
          expect(
            v.qiyamEnd!.difference(v.qiyamStart!).inHours,
            lessThan(12),
          );
        }
      }
    });
  });
}
