import 'package:seerah_app/core/app_log.dart';
import 'package:seerah_app/l10n/salah_phrases.dart';
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/timezone.dart' as tz;

import '../models/salah_prayer.dart';
import '../models/voluntary_prayer_times.dart';
import '../utils/app_strings.dart';
import 'app_guard_service.dart';
import 'decline_flow.dart';
import 'diagnostics_log.dart';
import 'incoming_call_alarm_service.dart';
import 'ios_alarmkit_service.dart';
import 'ios_hybrid_notification_scheduler.dart';
import 'timezone_service.dart';

/// Payload attached to every notification so taps can route to the
/// incoming-salah screen.
class SalahNotificationPayload {
  static const typePrayer = 'prayer';
  static const typeSnooze = 'snooze';
  static const typeTest = 'test';
  static const typeRefresh = 'refresh';
  static const typeVoluntary = 'voluntary';
  static const typeDua = 'dua';

  final String type;
  final SalahPrayer? prayer;

  /// Only for [typeDua]: the [DuaPerson.id] this reminder is for (null =
  /// a general du'a for loved ones).
  final String? duaPersonId;

  const SalahNotificationPayload({
    required this.type,
    this.prayer,
    this.duaPersonId,
  });

  String encode() => jsonEncode({
    'type': type,
    'prayer': prayer?.name,
    if (duaPersonId != null) 'duaPersonId': duaPersonId,
  });

  static SalahNotificationPayload? decode(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return SalahNotificationPayload(
        type: map['type'] as String? ?? typePrayer,
        prayer:
            map['prayer'] == null
                ? null
                : SalahPrayer.fromName(map['prayer'] as String),
        duaPersonId: map['duaPersonId'] as String?,
      );
    } catch (_) {
      return null;
    }
  }
}

/// Which channel actually ended up carrying a scheduled primary prayer
/// reminder — never both, and never neither for an enabled prayer.
enum PrimaryReminderChannel {
  /// Delivered as a native AlarmKit alarm (iOS 26+, authorized).
  alarmKit,

  /// Delivered as an ordinary local notification (Android, older iOS, or
  /// the AlarmKit fallback path).
  notification,

  /// Both the primary channel and its local-notification fallback failed.
  /// The prayer has NO scheduled alert; callers must surface this rather
  /// than silently continuing.
  failed,
}

/// Outcome of a single [NotificationScheduler.schedulePrayerReminder] call,
/// so a hybrid scheduler's caller can tell which channel actually carries
/// the alert (or that neither does) instead of assuming success.
class PrimaryReminderOutcome {
  final PrimaryReminderChannel channel;

  /// Set only when [channel] is [PrimaryReminderChannel.alarmKit] — the
  /// native alarm UUID, so it can be persisted for cross-restart
  /// cancellation/reconciliation.
  final String? alarmKitId;

  /// Set only when [channel] is [PrimaryReminderChannel.failed].
  final Object? error;

  const PrimaryReminderOutcome._(this.channel, this.alarmKitId, this.error);

  const PrimaryReminderOutcome.alarmKit(String alarmKitId)
    : this._(PrimaryReminderChannel.alarmKit, alarmKitId, null);

  const PrimaryReminderOutcome.notification()
    : this._(PrimaryReminderChannel.notification, null, null);

  const PrimaryReminderOutcome.failed(Object error)
    : this._(PrimaryReminderChannel.failed, null, error);

  bool get succeeded => channel != PrimaryReminderChannel.failed;
}

/// Abstraction over the platform notification plugin so the scheduler can be
/// unit-tested with a fake implementation.
abstract class NotificationScheduler {
  /// Schedules the primary reminder for a prayer occurrence. Must never
  /// throw for an expected failure (e.g. a platform channel error) — return
  /// [PrimaryReminderOutcome.failed] instead, so a single bad primary can
  /// never abort scheduling the rest of the batch (see
  /// [PrayerSchedulerService.rescheduleAll]).
  Future<PrimaryReminderOutcome> schedulePrayerReminder({
    required int id,
    required SalahPrayer prayer,
    required tz.TZDateTime scheduledAt,
    required bool callStyle,
  });

  /// A gentle follow-up while the prayer window is still open (missed-prayer
  /// recovery). Never scheduled past the next prayer's entry.
  Future<void> scheduleFollowUpReminder({
    required int id,
    required SalahPrayer prayer,
    required tz.TZDateTime scheduledAt,
    required bool callStyle,
  });

  /// Safety notification fired only if the app never refreshed its schedule
  /// before the reminder window ran out (cancelled and rescheduled on every
  /// successful reschedule).
  Future<void> scheduleRefreshReminder({
    required int id,
    required tz.TZDateTime scheduledAt,
  });

  /// Opt-in, gentle reminder that a voluntary prayer's window (Duha) or time
  /// (Qiyam) has begun. A plain, quiet notification: never call-style, no
  /// Answer/Decline actions, no follow-up, never AlarmKit.
  Future<void> scheduleVoluntaryReminder({
    required int id,
    required VoluntaryPrayer prayer,
    required tz.TZDateTime scheduledAt,
  });

  /// Opt-in "du'a for loved ones" reminder; tapping it opens the timed du'a
  /// card for [personId] (null = a general reminder). Never AlarmKit.
  ///
  /// By default a plain, quiet notification the user taps to open the card.
  /// When [fullScreen] is true it instead uses a call-style presentation
  /// (like the prayer call screen) so the card can open automatically
  /// without a tap, while the device is locked.
  ///
  /// Has a no-op default so schedulers that predate this feature (test
  /// fakes) keep compiling; the real implementations override it.
  Future<void> scheduleDuaReminder({
    required int id,
    required tz.TZDateTime scheduledAt,
    required String title,
    required String body,
    String? personId,
    bool fullScreen = false,
  }) async {}

  Future<void> cancel(int id);

  /// Notification IDs the OS actually still has pending right now. Used to
  /// reconcile against persisted bookkeeping before capacity-sensitive
  /// operations (see notification_reconciliation.dart /
  /// notification_budget.dart) — ground truth for what is really scheduled,
  /// which can drift from persistence (already-fired entries, or platform
  /// caps silently dropping something).
  Future<List<int>> pendingIds();
}

/// Handles permissions, channels, and scheduling of all local notifications.
class LocalNotificationService implements NotificationScheduler {
  static const String prayerChannelId = 'salah_reminders';
  static const String prayerChannelName = 'Salah Reminders';
  static const String prayerChannelDescription =
      'Reminders when prayer time enters';

  static const String voluntaryChannelId = 'salah_voluntary';
  static const String voluntaryChannelName = 'Duha & Qiyam';
  static const String voluntaryChannelDescription =
      'Optional gentle reminders for the Duha and Qiyam prayers';

  // Android freezes a channel's importance the first time it is created, and
  // the original 'salah_dua' channel was created lazily at *default*
  // importance (no heads-up banner, silent on many phones) — so the du'a
  // reminder fired but was easy to miss entirely. These are fresh channel ids
  // created explicitly at high/max importance in [initialize]; the legacy id
  // is deleted there so it no longer shows up (muted) in system settings.
  static const String legacyDuaChannelId = 'salah_dua';
  static const String duaChannelId = 'salah_dua_v2';
  static const String duaCallChannelId = 'salah_dua_call';
  static const String duaChannelName = 'Du\'a for loved ones';
  static const String duaCallChannelName = 'Du\'a for loved ones (full screen)';
  static const String duaChannelDescription =
      'Optional reminders to make du\'a for the people you love';

  /// Notification action identifiers (Android actions / iOS category actions).
  static const String actionPrayNow = 'pray_now';
  static const String actionDecline = 'decline';

  /// iOS notification category carrying the two actions.
  static const String darwinSalahCategory = 'salah_reminder_category';

  static const int testNotificationId = 1;

  /// Fixed ID for the schedule-refresh safety notification.
  static const int refreshReminderId = 2;

  final FlutterLocalNotificationsPlugin _plugin;
  final AppGuardService _appGuard;
  final IncomingCallAlarmService _incomingCallAlarm;

  /// Called when the user taps a notification or its "Pray Now" action while
  /// the app is running (foreground/background). [actionId] is null for a
  /// plain body tap.
  void Function(SalahNotificationPayload payload, String? actionId)?
  onNotificationTap;

  LocalNotificationService([
    FlutterLocalNotificationsPlugin? plugin,
    AppGuardService? appGuard,
    IncomingCallAlarmService? incomingCallAlarm,
  ]) : _plugin = plugin ?? FlutterLocalNotificationsPlugin(),
       _appGuard = appGuard ?? AppGuardService(),
       _incomingCallAlarm = incomingCallAlarm ?? IncomingCallAlarmService();

  /// Whether "Display over other apps" is granted — without it, the primary
  /// reminder can only force-launch via the ordinary full-screen-intent
  /// notification, which Android downgrades to a tap-required heads-up
  /// banner while the device is unlocked. Surfaced in Settings.
  Future<bool> hasIncomingCallOverlayPermission() =>
      _incomingCallAlarm.hasOverlayPermission();

  /// Opens the system "Display over other apps" settings screen so the user
  /// can grant [hasIncomingCallOverlayPermission].
  Future<void> requestIncomingCallOverlayPermission() =>
      _incomingCallAlarm.requestOverlayPermission();

  /// Consumes a pending prayer recorded by the native direct-launch alarm,
  /// if the app was just force-foregrounded (or is cold-starting into) one.
  /// Call once at startup and on every app resume.
  Future<SalahPrayer?> consumePendingIncomingCall() =>
      _incomingCallAlarm.consumePending();

  /// Deterministic ID per prayer occurrence: identical inputs always produce
  /// the same ID, so rescheduling replaces instead of duplicating.
  /// Layout: (minutes since epoch, cyclic) * 20 + slot.
  /// Slots 0-4 = prayer reminders, 5-9 = snoozes, 10-14 = follow-ups,
  /// 15 = Duha, 16 = Qiyam (see [voluntaryNotificationIdFor]).
  static int notificationIdFor(
    SalahPrayer prayer,
    DateTime scheduledAt, {
    bool snooze = false,
    bool followUp = false,
  }) {
    assert(!(snooze && followUp));
    final minutes = scheduledAt.toUtc().millisecondsSinceEpoch ~/ 60000;
    final slot = prayer.index + (snooze ? 5 : (followUp ? 10 : 0));
    return (minutes % 100000000) * 20 + slot;
  }

  /// Deterministic ID for a voluntary-prayer reminder, in the unused slots
  /// 15/16 of the same layout as [notificationIdFor] so it can never collide
  /// with a prayer, snooze or follow-up ID.
  static int voluntaryNotificationIdFor(
    VoluntaryPrayer prayer,
    DateTime scheduledAt,
  ) {
    final minutes = scheduledAt.toUtc().millisecondsSinceEpoch ~/ 60000;
    return (minutes % 100000000) * 20 + 15 + prayer.index;
  }

  /// Deterministic ID for a du'a-for-loved-ones reminder, in slot 17 of the
  /// same layout (slots 15/16 are Duha/Qiyam), so it can never collide with
  /// any other reminder kind.
  static int duaNotificationIdFor(DateTime scheduledAt) {
    final minutes = scheduledAt.toUtc().millisecondsSinceEpoch ~/ 60000;
    return (minutes % 100000000) * 20 + 17;
  }

  Future<void> initialize() async {
    TimezoneService.ensureInitialized();

    final initializationSettings = InitializationSettings(
      android: const AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(
        // Permissions are requested explicitly via requestPermissions().
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
        notificationCategories: [
          DarwinNotificationCategory(
            darwinSalahCategory,
            actions: [
              DarwinNotificationAction.plain(
                actionPrayNow,
                // iOS: Answer opens the prayer-call screen. Android uses
                // "Pray Now" on its own action labels (see AndroidNotificationAction).
                translateSalah(salahLang, AppStrings.answer),
                options: {DarwinNotificationActionOption.foreground},
              ),
              DarwinNotificationAction.plain(
                actionDecline,
                // iOS label "Dismiss"; same action id as Android Decline
                // (respectful snooze). Does not open the call UI.
                translateSalah(salahLang, AppStrings.dismiss),
              ),
            ],
          ),
        ],
      ),
    );

    await _plugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (response) {
        final payload = SalahNotificationPayload.decode(response.payload);
        if (payload != null) {
          onNotificationTap?.call(payload, response.actionId);
        }
      },
      onDidReceiveBackgroundNotificationResponse: notificationActionBackground,
    );

    if (!kIsWeb && Platform.isAndroid) {
      await _androidImpl?.createNotificationChannel(
        const AndroidNotificationChannel(
          prayerChannelId,
          prayerChannelName,
          description: prayerChannelDescription,
          importance: Importance.max,
          playSound: true,
          enableVibration: true,
        ),
      );
      // Du'a reminders: created up front (not lazily on first schedule) so
      // the importance is guaranteed heads-up rather than whatever the first
      // scheduled notification happened to request.
      await _androidImpl?.createNotificationChannel(
        const AndroidNotificationChannel(
          duaChannelId,
          duaChannelName,
          description: duaChannelDescription,
          importance: Importance.high,
          playSound: true,
          enableVibration: true,
        ),
      );
      await _androidImpl?.createNotificationChannel(
        const AndroidNotificationChannel(
          duaCallChannelId,
          duaCallChannelName,
          description: duaChannelDescription,
          importance: Importance.max,
          playSound: true,
          enableVibration: true,
        ),
      );
      try {
        await _androidImpl?.deleteNotificationChannel(legacyDuaChannelId);
      } catch (_) {}
    }
  }

  AndroidFlutterLocalNotificationsPlugin? get _androidImpl =>
      _plugin
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >();

  IOSFlutterLocalNotificationsPlugin? get _iosImpl =>
      _plugin
          .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin
          >();

  /// If the app was launched by tapping a notification (or an action on
  /// one), returns its payload and the action that launched it.
  Future<({SalahNotificationPayload payload, String? actionId})?>
  getLaunchDetails() async {
    final details = await _plugin.getNotificationAppLaunchDetails();
    if (details?.didNotificationLaunchApp != true) return null;
    final payload = SalahNotificationPayload.decode(
      details!.notificationResponse?.payload,
    );
    if (payload == null) return null;
    return (payload: payload, actionId: details.notificationResponse?.actionId);
  }

  // ------------------------------------------------------------- permissions

  Future<bool> requestPermissions() async {
    if (kIsWeb) return false;
    if (Platform.isAndroid) {
      final android = _androidImpl;
      final granted = await android?.requestNotificationsPermission() ?? false;
      // Exact alarms make reminders land on the minute; gracefully degrade
      // to inexact scheduling if the user does not grant it.
      if (await android?.canScheduleExactNotifications() == false) {
        await android?.requestExactAlarmsPermission();
      }
      // Note: the full-screen intent permission is intentionally NOT
      // requested here. It routes the user out to system settings, so the UI
      // first explains why via a guidance dialog, then calls
      // requestFullScreenIntent().
      return granted;
    }
    if (Platform.isIOS) {
      final granted =
          await _iosImpl?.requestPermissions(
            alert: true,
            badge: true,
            sound: true,
          ) ??
          false;
      return granted;
    }
    return false;
  }

  /// Requests the Android 14+ full-screen intent special permission (routes
  /// to system settings). Call only after showing the guidance dialog.
  Future<void> requestFullScreenIntent() async {
    if (kIsWeb || !Platform.isAndroid) return;
    try {
      await _androidImpl?.requestFullScreenIntentPermission();
    } catch (e) {
      debugPrint('Full-screen intent permission request failed: $e');
    }
  }

  Future<bool> areNotificationsEnabled() async {
    if (kIsWeb) return false;
    if (Platform.isAndroid) {
      return await _androidImpl?.areNotificationsEnabled() ?? false;
    }
    if (Platform.isIOS) {
      final settings = await _iosImpl?.checkPermissions();
      return settings?.isEnabled ?? false;
    }
    return false;
  }

  Future<bool> canScheduleExactAlarms() async {
    if (kIsWeb || !Platform.isAndroid) return true;
    return await _androidImpl?.canScheduleExactNotifications() ?? false;
  }

  // -------------------------------------------------------------- scheduling

  NotificationDetails _prayerDetails({
    required bool callStyle,
    bool withActions = true,
  }) {
    return NotificationDetails(
      android: AndroidNotificationDetails(
        prayerChannelId,
        prayerChannelName,
        channelDescription: prayerChannelDescription,
        importance: Importance.max,
        priority: Priority.max,
        category:
            callStyle
                ? AndroidNotificationCategory.call
                : AndroidNotificationCategory.reminder,
        // Platform-compliant call-style presentation: shows over the lock
        // screen / as heads-up where the user has allowed it.
        fullScreenIntent: callStyle,
        visibility: NotificationVisibility.public,
        audioAttributesUsage: AudioAttributesUsage.notificationRingtone,
        actions:
            withActions
                ? [
                  AndroidNotificationAction(
                    actionPrayNow,
                    translateSalah(salahLang, AppStrings.prayNow),
                    showsUserInterface: true,
                    cancelNotification: true,
                  ),
                  AndroidNotificationAction(
                    actionDecline,
                    translateSalah(salahLang, AppStrings.declineLabel),
                    cancelNotification: true,
                  ),
                ]
                : null,
      ),
      iOS: DarwinNotificationDetails(
        presentAlert: true,
        presentSound: true,
        presentBanner: true,
        categoryIdentifier: withActions ? darwinSalahCategory : null,
        // Time-sensitive delivery. Requires the Time Sensitive Notifications
        // entitlement (ios/Runner/Runner.entitlements) and a provisioning
        // profile that supports it. Degradation is graceful and automatic:
        // if the entitlement is missing or the user disables Time Sensitive
        // delivery for this app, iOS delivers the reminder as an ordinary
        // notification — it is never dropped.
        interruptionLevel: InterruptionLevel.timeSensitive,
      ),
    );
  }

  @override
  Future<PrimaryReminderOutcome> schedulePrayerReminder({
    required int id,
    required SalahPrayer prayer,
    required tz.TZDateTime scheduledAt,
    required bool callStyle,
  }) async {
    final title =
        (!kIsWeb && Platform.isIOS)
            ? translateSalah(salahLang, AppStrings.incomingCallTitle)
            : translateSalah(salahLang, AppStrings.notificationTitle);
    try {
      await _zonedSchedule(
        id: id,
        title: title,
        body: translateSalah(salahLang, AppStrings.prayerEnteredBody(prayer.displayName)),
        scheduledAt: scheduledAt,
        details: _prayerDetails(callStyle: callStyle),
        payload:
            SalahNotificationPayload(
              type: SalahNotificationPayload.typePrayer,
              prayer: prayer,
            ).encode(),
      );
      // App Guard (Android only; a no-op elsewhere — see AppGuardService):
      // arms the native 15-minute "cover guarded apps" window for the exact
      // moment this prayer enters, independent of whether the Flutter
      // engine/app is even running when that moment arrives. Keyed by the
      // same deterministic [id] as this reminder so cancelling one cancels
      // both (see cancel() below).
      //
      // Awaited (previously fire-and-forget `unawaited`): this call and the
      // direct-launch alarm below both go out on their own native method
      // channels, independent of the plugin notification scheduled above.
      // A caller that doesn't wait for them to actually land natively
      // before moving on can race a *later* `cancel(id)` for the very same
      // id (e.g. from a second, overlapping `rescheduleAll` triggered by
      // rapidly tapping the Settings "Match my local masjid" +/- stepper —
      // see AppController.recalculateAndReschedule's serialization fix).
      // If that cancel's native message reaches the platform side before
      // this schedule's does, the alarm ends up cancelled despite this
      // call "succeeding" — which surfaced as the ordinary notification
      // firing (the plugin-scheduled one, overwritten safely by id) but the
      // full-screen call UI never taking over (the direct-launch alarm,
      // which has no such overwrite protection, silently lost the race).
      // Awaiting here guarantees this call's native message is fully
      // processed before the function returns, so a subsequent cancel for
      // the same id can never be reordered ahead of it.
      await _appGuard.scheduleGuardWindow(
        id: id,
        prayer: prayer.displayName,
        triggerAt: scheduledAt,
      );
      // Direct-launch alarm (Android only; see IncomingCallAlarmService):
      // force-foregrounds the app at this same moment when overlay
      // permission is granted, so the call screen takes over even while
      // the notification above would only show as a tappable heads-up
      // banner (device unlocked and in another app). Skipped when the user
      // has turned the full-screen call UI off — there would be nothing for
      // it to force open to.
      if (callStyle) {
        await _incomingCallAlarm.schedule(
          id: id,
          prayer: prayer,
          triggerAt: scheduledAt,
        );
      }
      return const PrimaryReminderOutcome.notification();
    } catch (e) {
      // _zonedSchedule already retries inexact on a PlatformException; this
      // only catches the (very rare) case where that retry also failed.
      // Reporting failure here — rather than rethrowing — is what lets
      // rescheduleAll's caller continue scheduling the remaining prayers
      // instead of aborting the whole batch (see NotificationScheduler
      // docs). The normal success path is completely unchanged.
      return PrimaryReminderOutcome.failed(e);
    }
  }

  @override
  Future<void> scheduleFollowUpReminder({
    required int id,
    required SalahPrayer prayer,
    required tz.TZDateTime scheduledAt,
    required bool callStyle,
  }) async {
    await _zonedSchedule(
      id: id,
      title: translateSalah(salahLang, AppStrings.followUpTitle),
      body: translateSalah(salahLang, AppStrings.followUpBody(prayer.displayName)),
      scheduledAt: scheduledAt,
      // Follow-ups are gentler: never full-screen, standard category.
      details: _prayerDetails(callStyle: false),
      payload:
          SalahNotificationPayload(
            type: SalahNotificationPayload.typeSnooze,
            prayer: prayer,
          ).encode(),
    );
  }

  @override
  Future<void> scheduleRefreshReminder({
    required int id,
    required tz.TZDateTime scheduledAt,
  }) async {
    await _zonedSchedule(
      id: id,
      title: translateSalah(salahLang, AppStrings.refreshReminderTitle),
      body: translateSalah(salahLang, AppStrings.refreshReminderBody),
      scheduledAt: scheduledAt,
      // Plain notification: no call presentation, no Answer/Decline actions.
      details: _prayerDetails(callStyle: false, withActions: false),
      payload:
          const SalahNotificationPayload(
            type: SalahNotificationPayload.typeRefresh,
          ).encode(),
    );
  }

  @override
  Future<void> scheduleVoluntaryReminder({
    required int id,
    required VoluntaryPrayer prayer,
    required tz.TZDateTime scheduledAt,
  }) async {
    final isDuha = prayer == VoluntaryPrayer.duha;
    await _zonedSchedule(
      id: id,
      title: translateSalah(
        salahLang,
        isDuha ? AppStrings.duhaReminderTitle : AppStrings.qiyamReminderTitle,
      ),
      body: translateSalah(
        salahLang,
        isDuha ? AppStrings.duhaReminderBody : AppStrings.qiyamReminderBody,
      ),
      scheduledAt: scheduledAt,
      details: _voluntaryDetails(),
      payload:
          const SalahNotificationPayload(
            type: SalahNotificationPayload.typeVoluntary,
          ).encode(),
    );
  }

  @override
  Future<void> scheduleDuaReminder({
    required int id,
    required tz.TZDateTime scheduledAt,
    required String title,
    required String body,
    String? personId,
    bool fullScreen = false,
  }) async {
    await _zonedSchedule(
      id: id,
      title: title,
      body: body,
      scheduledAt: scheduledAt,
      details: _duaDetails(fullScreen: fullScreen),
      payload:
          SalahNotificationPayload(
            type: SalahNotificationPayload.typeDua,
            duaPersonId: personId,
          ).encode(),
    );
  }

  /// Presentation for du'a reminders: its own channel (so it can be
  /// silenced independently in system settings).
  ///
  /// Default ([fullScreen] false): high importance (heads-up banner + sound),
  /// no full-screen takeover — a top-of-screen notification the user taps to
  /// open the card, ordinary iOS interruption level.
  ///
  /// [fullScreen] true: call-style presentation (same mechanism as the
  /// prayer call screen) — shows over the lock screen automatically where
  /// the OS allows it, and degrades to a heads-up banner otherwise; never
  /// silently dropped.
  NotificationDetails _duaDetails({required bool fullScreen}) {
    return NotificationDetails(
      android: AndroidNotificationDetails(
        fullScreen ? duaCallChannelId : duaChannelId,
        fullScreen ? duaCallChannelName : duaChannelName,
        channelDescription: duaChannelDescription,
        importance: fullScreen ? Importance.max : Importance.high,
        priority: Priority.high,
        playSound: true,
        enableVibration: true,
        category:
            fullScreen
                ? AndroidNotificationCategory.call
                : AndroidNotificationCategory.reminder,
        fullScreenIntent: fullScreen,
        visibility: NotificationVisibility.public,
      ),
      iOS: DarwinNotificationDetails(
        presentAlert: true,
        presentSound: true,
        presentBanner: true,
        interruptionLevel:
            fullScreen
                ? InterruptionLevel.timeSensitive
                : InterruptionLevel.active,
      ),
    );
  }

  /// Quiet presentation for voluntary-prayer reminders: its own channel so
  /// the user can silence it independently in system settings, default
  /// importance (no ringtone, no heads-up takeover), and — on iOS — an
  /// ordinary (not time-sensitive) interruption level.
  NotificationDetails _voluntaryDetails() {
    return const NotificationDetails(
      android: AndroidNotificationDetails(
        voluntaryChannelId,
        voluntaryChannelName,
        channelDescription: voluntaryChannelDescription,
        importance: Importance.defaultImportance,
        priority: Priority.defaultPriority,
        category: AndroidNotificationCategory.reminder,
        visibility: NotificationVisibility.public,
      ),
      iOS: DarwinNotificationDetails(
        presentAlert: true,
        presentSound: true,
        presentBanner: true,
        interruptionLevel: InterruptionLevel.active,
      ),
    );
  }

  /// Schedules a user-requested Decline snooze. Returns the notification ID.
  ///
  /// [userTimezone] is the IANA timezone of the user's selected location.
  /// Passing it ensures the "fire at" instant is correct even when the
  /// device timezone differs from the city the user has selected.
  ///
  /// [fireAt] pins the exact fire instant (used by the shared Decline flow so
  /// the persisted record and the scheduled notification agree); when null,
  /// it is now + [minutes].
  ///
  /// When [windowStillOpen] is false (the next prayer will have entered by
  /// the time the snooze fires), generic copy is used so the notification
  /// never implies an expired prayer window is still open.
  Future<int> scheduleSnooze({
    required SalahPrayer prayer,
    required int minutes,
    required bool callStyle,
    String? userTimezone,
    bool windowStillOpen = true,
    DateTime? fireAt,
  }) async {
    TimezoneService.ensureInitialized();
    tz.Location zone;
    try {
      zone = userTimezone != null ? tz.getLocation(userTimezone) : tz.local;
    } catch (_) {
      zone = tz.local;
    }
    final fireAtZoned =
        fireAt != null
            ? tz.TZDateTime.from(fireAt, zone)
            : tz.TZDateTime.now(zone).add(Duration(minutes: minutes));
    final id = notificationIdFor(prayer, fireAtZoned, snooze: true);
    await _zonedSchedule(
      id: id,
      title:
          windowStillOpen
              ? translateSalah(salahLang, AppStrings.snoozeTitle)
              : translateSalah(salahLang, AppStrings.genericReminderTitle),
      body:
          windowStillOpen
              ? translateSalah(salahLang, AppStrings.snoozeBody(prayer.displayName))
              : translateSalah(salahLang, AppStrings.genericReminderBody),
      scheduledAt: fireAtZoned,
      details: _prayerDetails(callStyle: callStyle),
      payload:
          SalahNotificationPayload(
            type: SalahNotificationPayload.typeSnooze,
            prayer: prayer,
          ).encode(),
    );
    return id;
  }

  Future<void> _zonedSchedule({
    required int id,
    required String title,
    required String body,
    required tz.TZDateTime scheduledAt,
    required NotificationDetails details,
    required String payload,
  }) async {
    final exact = await canScheduleExactAlarms();
    try {
      await _plugin.zonedSchedule(
        id,
        title,
        body,
        scheduledAt,
        details,
        androidScheduleMode:
            exact
                ? AndroidScheduleMode.exactAllowWhileIdle
                : AndroidScheduleMode.inexactAllowWhileIdle,
        payload: payload,
      );
    } on PlatformException catch (e) {
      // Exact alarm permission may have been revoked between the check and
      // the call; retry inexact so the reminder is never silently dropped.
      debugPrint('Exact schedule failed ($e); retrying inexact.');
      AppLog.warn('Exact alarm scheduling failed; fell back to inexact', {
        'error_code': e.code,
        'exact_permission_reported': exact,
      });
      await _plugin.zonedSchedule(
        id,
        title,
        body,
        scheduledAt,
        details,
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        payload: payload,
      );
    }
  }

  /// Debug-only: schedules the native direct-launch alarm (see
  /// IncomingCallAlarmService) a few seconds from now, so the "unlocked and
  /// backgrounded" force-launch path can be exercised without waiting for
  /// a real prayer time. Exercises the exact same production code path as
  /// a real primary reminder — just the direct-launch alarm, not the
  /// ordinary notification.
  Future<void> scheduleDebugIncomingCall({
    required SalahPrayer prayer,
    Duration delay = const Duration(seconds: 10),
  }) {
    return _incomingCallAlarm.schedule(
      id: testNotificationId,
      prayer: prayer,
      triggerAt: DateTime.now().add(delay),
    );
  }

  /// Shows an immediate test notification.
  Future<void> showTestNotification() async {
    await _plugin.show(
      testNotificationId,
      translateSalah(salahLang, AppStrings.notificationTitle),
      translateSalah(salahLang, AppStrings.testNotificationBody),
      _prayerDetails(callStyle: true),
      payload:
          const SalahNotificationPayload(
            type: SalahNotificationPayload.typeTest,
            prayer: SalahPrayer.dhuhr,
          ).encode(),
    );
  }

  @override
  Future<void> cancel(int id) async {
    // Harmless no-op on non-Android/when no guard window or direct-launch
    // alarm was ever scheduled for this id (follow-ups, snoozes, the
    // refresh notification).
    //
    // Awaited (previously fire-and-forget `unawaited`) for the same reason
    // as schedulePrayerReminder's matching native calls above: this must
    // fully land before the caller can treat [id] as free to reuse for a
    // fresh schedule, otherwise a cancel can be reordered to land *after*
    // a same-id reschedule on the native side despite running first here.
    await _appGuard.cancelGuardWindow(id);
    await _incomingCallAlarm.cancel(id);
    await _plugin.cancel(id);
  }

  Future<void> cancelAll() {
    unawaited(_appGuard.cancelAllGuardWindows());
    unawaited(_incomingCallAlarm.cancelAll());
    return _plugin.cancelAll();
  }

  Future<List<PendingNotificationRequest>> pendingNotifications() =>
      _plugin.pendingNotificationRequests();

  @override
  Future<List<int>> pendingIds() async =>
      (await pendingNotifications()).map((p) => p.id).toList();
}

/// Handles notification action taps delivered while the app is not running
/// in the foreground. Runs in a separate background isolate, so it cannot
/// touch the widget tree or the AppController — it works directly against
/// SharedPreferences and the notification plugin.
///
/// Only "Decline" is handled here; "Pray Now" opens the app and is
/// routed through the normal foreground/launch flow.
///
/// Decline performs exactly the same logical operation as the in-app
/// Decline: cancel the pending follow-up for this prayer window, schedule
/// the configured snooze (idempotently), and persist both changes. The
/// shared implementation lives in decline_flow.dart so the two paths cannot
/// drift apart.
// Initialization audit for this entry point (runs in a fresh background
// isolate with no Flutter app, possibly with the app terminated):
//   1. @pragma('vm:entry-point')     — below; required so AOT keeps this
//                                      function reachable for the plugin's
//                                      background isolate.
//   2. Plugin registration           — flutter_local_notifications registers
//                                      its own background channel; no other
//                                      plugins are touched except
//                                      shared_preferences (isolate-safe).
//   3. Timezone database             — TimezoneService.ensureInitialized()
//                                      (idempotent) before any scheduling.
//   4. SharedPreferences freshness   — prefs.reload() so this isolate sees
//                                      what the main isolate last persisted.
//   5. Notification plugin           — service.initialize() before
//                                      scheduling the snooze.
//   6. Payload parsing               — a malformed/missing payload aborts
//                                      WITHOUT scheduling anything (an
//                                      incorrect snooze is worse than none)
//                                      and is logged.
//   7. Follow-up cancellation +
//      idempotency                   — shared performDecline() (same code
//                                      as foreground; see decline_flow.dart).
//   8. AlarmKit-aware cancellation   — on iOS 26+, a fresh
//                                      IosHybridNotificationScheduler is
//                                      built here too (mirroring main.dart)
//                                      so this isolate's reconciliation never
//                                      mistakes a persisted AlarmKit primary
//                                      for stale and drops it.
//   9. Error logging                 — failures are never swallowed: logged
//                                      to the console AND to the persistent
//                                      DiagnosticsLog ring buffer (no prayer
//                                      names or personal data in entries).
@pragma('vm:entry-point')
Future<void> notificationActionBackground(NotificationResponse response) async {
  if (response.actionId != LocalNotificationService.actionDecline &&
      response.actionId != 'remind_later') {
    return;
  }

  final payload = SalahNotificationPayload.decode(response.payload);
  final prayer = payload?.prayer;
  if (prayer == null) {
    // Never schedule a snooze from an unparseable payload.
    debugPrint(
      '[bg-action] Decline received with malformed payload; '
      'no snooze scheduled.',
    );
    try {
      final prefs = await SharedPreferences.getInstance();
      await DiagnosticsLog.recordError(
        prefs,
        'notification_action',
        'malformed payload on Decline',
      );
    } catch (_) {}
    return;
  }

  SharedPreferences? prefs;
  try {
    TimezoneService.ensureInitialized();
    prefs = await SharedPreferences.getInstance();
    // This isolate may hold a stale cache; reload so we see the reminder
    // list the main isolate persisted.
    await prefs.reload();

    final service = LocalNotificationService();
    await service.initialize();
    // Mirror main.dart's production scheduler choice so this isolate's
    // reconciliation/cancellation agrees with the foreground app about
    // which channel (AlarmKit vs local) carries each persisted primary.
    final alarmKit = (!kIsWeb && Platform.isIOS) ? IosAlarmKitService() : null;
    final scheduler =
        alarmKit != null
            ? IosHybridNotificationScheduler(
              notifications: service,
              alarmKit: alarmKit,
            )
            : service;
    await performDecline(
      prefs: prefs,
      notificationService: service,
      notificationScheduler: scheduler,
      prayer: prayer,
    );
    debugPrint('[bg-action] Decline handled in background isolate.');
  } catch (e, st) {
    debugPrint('[bg-action] Background Decline FAILED: $e\n$st');
    if (prefs != null) {
      await DiagnosticsLog.recordError(
        prefs,
        'notification_action',
        'background Decline failed: $e',
      );
    }
  }
}
