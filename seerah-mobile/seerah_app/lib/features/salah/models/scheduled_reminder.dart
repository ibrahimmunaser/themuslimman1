import 'salah_prayer.dart';
import 'voluntary_prayer_times.dart';

/// What a scheduled notification represents, in scheduling priority order:
/// primary prayer reminders always win, then user-requested snoozes, then
/// the opt-in voluntary-prayer reminders, then automatic follow-ups.
enum ReminderKind {
  /// The main reminder fired when the prayer enters. Highest priority.
  prayer,

  /// A user-requested Decline snooze.
  snooze,

  /// A gentle automatic follow-up fired while the prayer window is still
  /// open, in case the first reminder was missed or ignored. Lowest priority.
  followUp,

  /// The safety notification asking the user to open the app before the
  /// scheduled reminder window runs out.
  refresh,

  /// Opt-in reminder for a voluntary prayer (Duha / Qiyam). A plain
  /// notification: no call screen, no snooze, no follow-up. Declared last so
  /// persisted indexes/names of the older kinds are unaffected.
  voluntary,

  /// Opt-in "du'a for loved ones" reminder. A plain notification whose tap
  /// opens the timed du'a card. Placeholder [ScheduledReminder.prayer] like
  /// [voluntary]. Declared last so older persisted kinds are unaffected.
  dua,
}

/// A scheduled local notification, persisted so it can be cancelled later.
class ScheduledReminder {
  final int notificationId;

  /// The obligatory prayer this reminder belongs to. For a
  /// [ReminderKind.voluntary] reminder this is only a placeholder (it has no
  /// obligatory prayer); read [voluntary] instead.
  final SalahPrayer prayer;

  /// The scheduled fire time (millisecondsSinceEpoch, UTC-based instant).
  final int scheduledAtMillis;

  final ReminderKind kind;

  /// Set only for a primary ([ReminderKind.prayer]) reminder that is
  /// actually carried by a native AlarmKit alarm rather than a local
  /// notification. Persisted so the hybrid scheduler's cancellation and
  /// pending-id bookkeeping survives an app restart (see
  /// `IosHybridNotificationScheduler.restoreTrackedAlarmIds`) — without
  /// this, [notificationId] alone cannot tell whether the OS-side alert for
  /// this occurrence is a local notification or an AlarmKit alarm.
  final String? alarmKitId;

  /// Set only for [ReminderKind.voluntary].
  final VoluntaryPrayer? voluntary;

  const ScheduledReminder({
    required this.notificationId,
    required this.prayer,
    required this.scheduledAtMillis,
    this.kind = ReminderKind.prayer,
    this.alarmKitId,
    this.voluntary,
  });

  DateTime get scheduledAt =>
      DateTime.fromMillisecondsSinceEpoch(scheduledAtMillis);

  ScheduledReminder copyWith({
    int? notificationId,
    SalahPrayer? prayer,
    int? scheduledAtMillis,
    ReminderKind? kind,
    String? alarmKitId,
    bool clearAlarmKitId = false,
    VoluntaryPrayer? voluntary,
  }) {
    return ScheduledReminder(
      notificationId: notificationId ?? this.notificationId,
      prayer: prayer ?? this.prayer,
      scheduledAtMillis: scheduledAtMillis ?? this.scheduledAtMillis,
      kind: kind ?? this.kind,
      alarmKitId: clearAlarmKitId ? null : (alarmKitId ?? this.alarmKitId),
      voluntary: voluntary ?? this.voluntary,
    );
  }

  Map<String, dynamic> toJson() => {
    'notificationId': notificationId,
    'prayer': prayer.name,
    'scheduledAtMillis': scheduledAtMillis,
    'kind': kind.name,
    if (alarmKitId != null) 'alarmKitId': alarmKitId,
    if (voluntary != null) 'voluntary': voluntary!.name,
  };

  factory ScheduledReminder.fromJson(Map<String, dynamic> json) {
    final voluntaryName = json['voluntary'] as String?;
    return ScheduledReminder(
      notificationId: (json['notificationId'] as num).toInt(),
      prayer:
          SalahPrayer.fromName(json['prayer'] as String) ?? SalahPrayer.fajr,
      scheduledAtMillis: (json['scheduledAtMillis'] as num).toInt(),
      kind: ReminderKind.values.firstWhere(
        (k) => k.name == json['kind'],
        orElse: () => ReminderKind.prayer,
      ),
      alarmKitId: json['alarmKitId'] as String?,
      voluntary:
          voluntaryName == null
              ? null
              : VoluntaryPrayer.values
                  .where((v) => v.name == voluntaryName)
                  .firstOrNull,
    );
  }
}
