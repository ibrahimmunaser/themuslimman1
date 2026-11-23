import 'package:flutter_test/flutter_test.dart';
import 'package:seerah_app/features/salah/models/dua.dart';
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
  final dua =
      <({
        int id,
        DateTime at,
        String title,
        String body,
        String? personId,
        bool fullScreen,
      })>[];
  final primaries = <int>[];

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
  }) async {}

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
  }) async {}

  @override
  Future<void> scheduleDuaReminder({
    required int id,
    required tz.TZDateTime scheduledAt,
    required String title,
    required String body,
    String? personId,
    bool fullScreen = false,
  }) async {
    dua.add((
      id: id,
      at: scheduledAt,
      title: title,
      body: body,
      personId: personId,
      fullScreen: fullScreen,
    ));
  }

  @override
  Future<void> cancel(int id) async {}

  @override
  Future<List<int>> pendingIds() async => const [];
}

const _nyc = PrayerSettings(
  latitude: 40.7128,
  longitude: -74.0060,
  timezone: 'America/New_York',
  locationLabel: 'New York',
);

const _mom = DuaPerson(
  id: 'mom',
  name: 'Mama',
  relation: DuaRelation.mother,
  isFemale: true,
  deceased: false,
);
const _dad = DuaPerson(
  id: 'dad',
  name: 'Baba',
  relation: DuaRelation.father,
  isFemale: false,
  deceased: true,
);

Future<(PrayerSchedulerService, _FakeScheduler)> _build(
  SchedulingPolicy policy, {
  List<DuaPerson> people = const [],
}) async {
  SharedPreferences.setMockInitialValues({});
  final repo = PrayerSettingsRepository(await SharedPreferences.getInstance());
  await repo.saveDuaPeople(people);
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

  test('off by default: no du\'a reminders are scheduled', () async {
    final (service, fake) = await _build(const SchedulingPolicy.android());
    final scheduled = await service.rescheduleAll(_nyc);
    expect(fake.dua, isEmpty);
    expect(scheduled.where((r) => r.kind == ReminderKind.dua), isEmpty);
    expect(fake.primaries, isNotEmpty);
  });

  test('Android: one reminder per selected window per day, persisted', () async {
    final (service, fake) = await _build(
      const SchedulingPolicy.android(),
      people: [_mom, _dad],
    );
    final settings = _nyc.copyWith(
      duaReminderEnabled: true,
      duaWindows: [DuaWindow.morning, DuaWindow.beforeMaghrib],
    );
    final scheduled = await service.rescheduleAll(settings);
    final persisted =
        scheduled.where((r) => r.kind == ReminderKind.dua).toList();

    // 2 windows x ~7 days (today's morning window may already be past).
    expect(fake.dua.length, inInclusiveRange(12, 14));
    expect(persisted.length, fake.dua.length);

    final now = DateTime.utc(2026, 1, 15, 12);
    for (final d in fake.dua) {
      expect(d.at.isAfter(now), isTrue);
      // Slot 17 never collides with prayer/snooze/follow-up/voluntary ids.
      expect(d.id % 20, 17);
      expect(d.title, isNotEmpty);
    }
    // No duplicate ids anywhere in the persisted schedule.
    final ids = scheduled.map((r) => r.notificationId).toList();
    expect(ids.toSet().length, ids.length);
  });

  test('full-screen toggle is off by default and flows through when on', () async {
    final (service, fakeOff) = await _build(
      const SchedulingPolicy.android(),
      people: [_mom],
    );
    await service.rescheduleAll(
      _nyc.copyWith(duaReminderEnabled: true, duaWindows: [DuaWindow.morning]),
    );
    expect(fakeOff.dua, isNotEmpty);
    expect(fakeOff.dua.every((d) => d.fullScreen == false), isTrue);

    final (service2, fakeOn) = await _build(
      const SchedulingPolicy.android(),
      people: [_mom],
    );
    await service2.rescheduleAll(
      _nyc.copyWith(
        duaReminderEnabled: true,
        duaWindows: [DuaWindow.morning],
        duaFullScreenEnabled: true,
      ),
    );
    expect(fakeOn.dua, isNotEmpty);
    expect(fakeOn.dua.every((d) => d.fullScreen == true), isTrue);
  });

  test('people rotate and their names appear in the notification', () async {
    final (service, fake) = await _build(
      const SchedulingPolicy.android(),
      people: [_mom, _dad],
    );
    await service.rescheduleAll(
      _nyc.copyWith(
        duaReminderEnabled: true,
        duaWindows: [DuaWindow.beforeMaghrib],
      ),
    );
    final named = fake.dua.map((d) => d.personId).toSet();
    expect(named, {'mom', 'dad'});
    for (final d in fake.dua) {
      final name = d.personId == 'mom' ? 'Mama' : 'Baba';
      expect(d.body, contains(name));
    }
  });

  test('no people yet: a general reminder still goes out', () async {
    final (service, fake) = await _build(const SchedulingPolicy.android());
    await service.rescheduleAll(
      _nyc.copyWith(duaReminderEnabled: true),
    );
    expect(fake.dua, isNotEmpty);
    expect(fake.dua.every((d) => d.personId == null), isTrue);
  });

  test('prayer reminders off: du\'a reminders are off too', () async {
    final (service, fake) = await _build(
      const SchedulingPolicy.android(),
      people: [_mom],
    );
    final scheduled = await service.rescheduleAll(
      _nyc.copyWith(notificationsEnabled: false, duaReminderEnabled: true),
    );
    expect(fake.dua, isEmpty);
    expect(scheduled, isEmpty);
  });

  test('iOS cap: du\'a is limited, cap respected, baseline primaries kept',
      () async {
    const ios = SchedulingPolicy.ios();
    final (baseService, baseFake) = await _build(ios);
    await baseService.rescheduleAll(_nyc);
    final (service, fake) = await _build(ios, people: [_mom, _dad]);
    final scheduled = await service.rescheduleAll(
      _nyc.copyWith(
        duaReminderEnabled: true,
        duaWindows: DuaWindow.values,
        duaCardSeconds: 60,
      ),
    );

    expect(fake.dua.length, lessThanOrEqualTo(ios.maxDuaReminders!));
    expect(fake.dua, isNotEmpty);
    expect(scheduled.length, lessThanOrEqualTo(ios.maxPending!));
    // The 7 guaranteed baseline days (35 primaries) are all still there.
    expect(fake.primaries.length, greaterThanOrEqualTo(35));
    expect(
      fake.primaries.length,
      lessThanOrEqualTo(baseFake.primaries.length),
    );
  });

  test('settings: JSON round-trip, defaults, bad values are repaired', () {
    final s = _nyc.copyWith(
      duaReminderEnabled: true,
      duaWindows: [DuaWindow.lastThird, DuaWindow.morning],
      duaFullScreenEnabled: true,
      duaCardSeconds: 60,
    );
    final back = PrayerSettings.fromJson(s.toJson());
    expect(back.duaReminderEnabled, isTrue);
    expect(back.duaWindows, [DuaWindow.lastThird, DuaWindow.morning]);
    expect(back.duaFullScreenEnabled, isTrue);
    expect(back.duaCardSeconds, 60);

    // Legacy JSON without the keys: off, one sensible window, 30 seconds.
    final legacy = Map<String, dynamic>.from(_nyc.toJson())
      ..remove('duaReminderEnabled')
      ..remove('duaWindows')
      ..remove('duaFullScreenEnabled')
      ..remove('duaCardSeconds');
    final old = PrayerSettings.fromJson(legacy);
    expect(old.duaReminderEnabled, isFalse);
    expect(old.duaWindows, [DuaWindow.beforeMaghrib]);
    expect(old.duaFullScreenEnabled, isFalse);
    expect(old.duaCardSeconds, 30);

    // Garbage: unknown windows dropped, odd durations fall back to 30.
    final junk = Map<String, dynamic>.from(_nyc.toJson())
      ..['duaWindows'] = ['nonsense']
      ..['duaCardSeconds'] = 45;
    final fixed = PrayerSettings.fromJson(junk);
    expect(fixed.duaWindows, [DuaWindow.beforeMaghrib]);
    expect(fixed.duaCardSeconds, 30);
  });

  test('people persist, and the payload carries the person id', () async {
    SharedPreferences.setMockInitialValues({});
    final repo = PrayerSettingsRepository(await SharedPreferences.getInstance());
    expect(repo.loadDuaPeople(), isEmpty);
    await repo.saveDuaPeople([_mom, _dad]);
    final back = repo.loadDuaPeople();
    expect(back.map((p) => p.id), ['mom', 'dad']);
    expect(back[1].deceased, isTrue);
    expect(back[0].relation, DuaRelation.mother);

    final payload = SalahNotificationPayload(
      type: SalahNotificationPayload.typeDua,
      duaPersonId: 'dad',
    );
    final decoded = SalahNotificationPayload.decode(payload.encode())!;
    expect(decoded.type, SalahNotificationPayload.typeDua);
    expect(decoded.duaPersonId, 'dad');
    // Older payloads (no person) still decode.
    expect(
      SalahNotificationPayload.decode(
        const SalahNotificationPayload(
          type: SalahNotificationPayload.typePrayer,
          prayer: SalahPrayer.asr,
        ).encode(),
      )!.duaPersonId,
      isNull,
    );
  });

  test('du\'a wording matches the person', () {
    final deceasedMother = _mom.copyWith(deceased: true);
    final texts = duaTextsFor(deceasedMother);
    // Forgiveness du'a, personalized to "my mother" (her) + the Qur'anic
    // du'a for parents.
    expect(texts.length, 2);
    expect(texts.first.arabic, contains('أُمِّي'));
    expect(texts.first.translation, contains('my mother'));
    expect(texts.last.source, contains('17:24'));

    final livingFriend = const DuaPerson(
      id: 'f',
      name: 'Yusuf',
      relation: DuaRelation.friend,
      isFemale: false,
      deceased: false,
    );
    final friendTexts = duaTextsFor(livingFriend);
    expect(friendTexts.length, 1);
    expect(friendTexts.first.arabic, contains('الْهُدَى'));

    expect(duaTextsFor(null), isNotEmpty);
  });

  test('du\'a rotates through 4 distinct options per day, gender-matched', () {
    final livingMother = _mom.copyWith(deceased: false);
    final seenLiving = <String>{};
    for (var day = 0; day < 4; day++) {
      final texts = duaTextsFor(livingMother, dayIndex: day);
      // Parent, so the Qur'an 17:24 du'a is always appended.
      expect(texts.length, 2);
      expect(texts.last.source, contains('17:24'));
      seenLiving.add(texts.first.translation);
      expect(texts.first.translation, contains('her'));
    }
    expect(seenLiving.length, 4); // all 4 days gave a distinct wording

    final deceasedMother = _mom.copyWith(deceased: true);
    final seenDeceased = <String>{};
    for (var day = 0; day < 4; day++) {
      final texts = duaTextsFor(deceasedMother, dayIndex: day);
      seenDeceased.add(texts.first.translation);
      expect(texts.first.translation, contains('her'));
    }
    expect(seenDeceased.length, 4);

    // A living father (not a parent-flagged du'a text difference) gets "him".
    final livingFather = const DuaPerson(
      id: 'dad',
      name: 'Dad',
      relation: DuaRelation.father,
      isFemale: false,
      deceased: false,
    );
    expect(duaTextsFor(livingFather, dayIndex: 1).first.translation, contains('him'));

    // Rotation wraps around: day 0 and day 4 give the same wording.
    expect(
      duaTextsFor(livingMother, dayIndex: 0).first.translation,
      duaTextsFor(livingMother, dayIndex: 4).first.translation,
    );
  });

  test('ids and budget: no collision, du\'a evicted before voluntary', () {
    final at = DateTime.utc(2026, 1, 15, 12, 30);
    final all = <int>{
      for (final p in SalahPrayer.values) ...[
        LocalNotificationService.notificationIdFor(p, at),
        LocalNotificationService.notificationIdFor(p, at, snooze: true),
        LocalNotificationService.notificationIdFor(p, at, followUp: true),
      ],
      for (final v in VoluntaryPrayer.values)
        LocalNotificationService.voluntaryNotificationIdFor(v, at),
      LocalNotificationService.duaNotificationIdFor(at),
    };
    expect(all.length, SalahPrayer.values.length * 3 + 3);

    final reconciled = [
      ScheduledReminder(
        notificationId: 1,
        prayer: SalahPrayer.fajr,
        scheduledAtMillis: 1000,
        kind: ReminderKind.dua,
      ),
      ScheduledReminder(
        notificationId: 2,
        prayer: SalahPrayer.fajr,
        scheduledAtMillis: 2000,
        kind: ReminderKind.voluntary,
        voluntary: VoluntaryPrayer.duha,
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
