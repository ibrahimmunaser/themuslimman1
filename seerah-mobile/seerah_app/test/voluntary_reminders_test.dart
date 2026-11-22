import 'package:flutter_test/flutter_test.dart';
import 'package:seerah_app/features/salah/models/prayer_settings.dart';
import 'package:seerah_app/features/salah/models/salah_prayer.dart';
import 'package:seerah_app/features/salah/models/scheduled_reminder.dart';
import 'package:seerah_app/features/salah/models/voluntary_prayer_times.dart';
import 'package:seerah_app/features/salah/repositories/prayer_settings_repository.dart';
import 'package:seerah_app/features/salah/services/local_notification_service.dart';
import 'package:seerah_app/features/salah/services/notification_budget.dart';
import 'package:seerah_app/features/salah/services/prayer_scheduler_service.dart';
import 'package:seerah_app/features/salah/services/prayer_time_service.dart';
import 'package:seerah_app/features/salah/services/timezone_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/timezone.dart' as tz;

class _FakeScheduler implements NotificationScheduler {
  final voluntary = <({int id, VoluntaryPrayer prayer, DateTime at})>[];
  final primaries = <int>[];
  final followUps = <int>[];
  final cancelled = <int>[];

  @override
  Future<PrimaryReminderOutcome> schedulePrayerReminder({
    required int id,
    required SalahPrayer prayer,
    required tz.TZDateTime scheduledAt,
    required bool callStyle,
  }) async {
    primaries.add(id);
    return const PrimaryReminderOutcome.notification();
  }

  @override
  Future<void> scheduleFollowUpReminder({
    required int id,
    required SalahPrayer prayer,
    required tz.TZDateTime scheduledAt,
    required bool callStyle,
  }) async {
    followUps.add(id);
  }

  @override
  Future<void> scheduleRefreshReminder({
    required int id,
    required tz.TZDateTime scheduledAt,
  }) async {}

  @override
  Future<void> scheduleVoluntaryReminder({
    required int id,
    required VoluntaryPrayer prayer,
    required tz.TZDateTime scheduledAt,
  }) async {
    voluntary.add((id: id, prayer: prayer, at: scheduledAt));
  }

  @override
  Future<void> cancel(int id) async => cancelled.add(id);

  @override
  Future<List<int>> pendingIds() async => const [];
}

const _nyc = PrayerSettings(
  latitude: 40.7128,
  longitude: -74.0060,
  timezone: 'America/New_York',
  locationLabel: 'New York',
);

Future<(PrayerSchedulerService, _FakeScheduler)> _build(
  SchedulingPolicy policy,
) async {
  SharedPreferences.setMockInitialValues({});
  final repo = PrayerSettingsRepository(await SharedPreferences.getInstance());
  final fake = _FakeScheduler();
  final service = PrayerSchedulerService(
    prayerTimeService: PrayerTimeService(),
    notificationScheduler: fake,
    repository: repo,
    policy: policy,
    // 2026-01-15 07:00 in New York.
    now: () => DateTime.utc(2026, 1, 15, 12),
  );
  return (service, fake);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  TimezoneService.ensureInitialized();

  test('off by default: nothing voluntary is scheduled', () async {
    final (service, fake) = await _build(const SchedulingPolicy.android());
    final scheduled = await service.rescheduleAll(_nyc);
    expect(fake.voluntary, isEmpty);
    expect(scheduled.where((r) => r.kind == ReminderKind.voluntary), isEmpty);
    expect(fake.primaries, isNotEmpty);
  });

  test('both on (Android): one Duha and one Qiyam per day, all persisted',
      () async {
    final (service, fake) = await _build(const SchedulingPolicy.android());
    final settings = _nyc.copyWith(
      duhaReminderEnabled: true,
      qiyamReminderEnabled: true,
    );
    final scheduled = await service.rescheduleAll(settings);
    final voluntary =
        scheduled.where((r) => r.kind == ReminderKind.voluntary).toList();

    final duha = fake.voluntary.where((v) => v.prayer == VoluntaryPrayer.duha);
    final qiyam =
        fake.voluntary.where((v) => v.prayer == VoluntaryPrayer.qiyam);
    expect(duha.length, inInclusiveRange(6, 7));
    expect(qiyam.length, inInclusiveRange(6, 8));
    expect(voluntary.length, fake.voluntary.length);

    final now = DateTime.utc(2026, 1, 15, 12);
    for (final v in fake.voluntary) {
      expect(v.at.isAfter(now), isTrue);
      // Reserved slots 15/16 never collide with prayer/snooze/follow-up ids.
      expect(v.id % 20, 15 + v.prayer.index);
    }
    // No duplicate ids anywhere in the persisted schedule.
    final ids = scheduled.map((r) => r.notificationId).toList();
    expect(ids.toSet().length, ids.length);
    // Duha opens in the morning, Qiyam in the small hours (local).
    for (final v in duha) {
      expect(v.at.hour, inInclusiveRange(6, 11));
    }
    for (final v in qiyam) {
      final h = v.at.hour;
      expect(h >= 0 && h <= 5 || h >= 22, isTrue);
    }
    // Persisted records round-trip and know which voluntary prayer they are.
    for (final r in voluntary) {
      final back = ScheduledReminder.fromJson(r.toJson());
      expect(back.kind, ReminderKind.voluntary);
      expect(back.voluntary, r.voluntary);
    }
  });

  test('only Qiyam on: no Duha is scheduled', () async {
    final (service, fake) = await _build(const SchedulingPolicy.android());
    await service.rescheduleAll(_nyc.copyWith(qiyamReminderEnabled: true));
    expect(fake.voluntary, isNotEmpty);
    expect(
      fake.voluntary.every((v) => v.prayer == VoluntaryPrayer.qiyam),
      isTrue,
    );
  });

  test('prayer reminders off: voluntary reminders are off too', () async {
    final (service, fake) = await _build(const SchedulingPolicy.android());
    final scheduled = await service.rescheduleAll(
      _nyc.copyWith(
        notificationsEnabled: false,
        duhaReminderEnabled: true,
        qiyamReminderEnabled: true,
      ),
    );
    expect(fake.voluntary, isEmpty);
    expect(scheduled, isEmpty);
  });

  test('iOS cap: voluntary reserved, cap respected, baseline primaries kept',
      () async {
    const ios = SchedulingPolicy.ios();
    final (baseService, baseFake) = await _build(ios);
    await baseService.rescheduleAll(_nyc);
    final (service, fake) = await _build(ios);
    final scheduled = await service.rescheduleAll(
      _nyc.copyWith(duhaReminderEnabled: true, qiyamReminderEnabled: true),
    );

    expect(scheduled.length, lessThanOrEqualTo(ios.maxPending!));
    expect(fake.voluntary.length, inInclusiveRange(1, 8));
    // The 7 guaranteed baseline days (35 primaries) are all still there.
    expect(fake.primaries.length, greaterThanOrEqualTo(35));
    // Coverage only gives up extension-day primaries, never the baseline.
    expect(
      fake.primaries.length,
      lessThanOrEqualTo(baseFake.primaries.length),
    );
  });

  test('settings and ids: JSON round-trip, defaults, no id collision', () {
    final s = _nyc.copyWith(duhaReminderEnabled: true);
    final back = PrayerSettings.fromJson(s.toJson());
    expect(back.duhaReminderEnabled, isTrue);
    expect(back.qiyamReminderEnabled, isFalse);
    // Legacy JSON without the keys: both default to off.
    final legacy = Map<String, dynamic>.from(_nyc.toJson())
      ..remove('duhaReminderEnabled')
      ..remove('qiyamReminderEnabled');
    final old = PrayerSettings.fromJson(legacy);
    expect(old.duhaReminderEnabled, isFalse);
    expect(old.qiyamReminderEnabled, isFalse);

    final at = DateTime.utc(2026, 1, 15, 12, 30);
    final all = <int>{
      for (final p in SalahPrayer.values) ...[
        LocalNotificationService.notificationIdFor(p, at),
        LocalNotificationService.notificationIdFor(p, at, snooze: true),
        LocalNotificationService.notificationIdFor(p, at, followUp: true),
      ],
      for (final v in VoluntaryPrayer.values)
        LocalNotificationService.voluntaryNotificationIdFor(v, at),
    };
    expect(all.length, SalahPrayer.values.length * 3 + 2);
  });

  test('budget: voluntary is evicted before a user snooze', () {
    final reconciled = [
      ScheduledReminder(
        notificationId: 1,
        prayer: SalahPrayer.fajr,
        scheduledAtMillis: 1000,
        kind: ReminderKind.voluntary,
        voluntary: VoluntaryPrayer.duha,
      ),
      ScheduledReminder(
        notificationId: 2,
        prayer: SalahPrayer.dhuhr,
        scheduledAtMillis: 2000,
        kind: ReminderKind.snooze,
      ),
    ];
    final plan = planAdmission(
      reconciled: reconciled,
      candidate: ScheduledReminder(
        notificationId: 3,
        prayer: SalahPrayer.asr,
        scheduledAtMillis: 3000,
        kind: ReminderKind.snooze,
      ),
      maxPending: 2,
    );
    expect(plan.admitted, isTrue);
    expect(plan.idsToEvict, [1]);
  });
}
