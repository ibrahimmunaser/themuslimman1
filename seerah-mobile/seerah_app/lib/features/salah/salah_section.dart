// Embeds the former standalone "Allah Is Calling" app as a section of
// The Muslim Man / Seerah app, instead of its own top-level main()/
// MaterialApp. All prayer-time/reminder/App Guard/Quran/Qibla logic below
// is unchanged from the standalone app's lib/main.dart — only the shell
// (runApp/MaterialApp -> an embeddable widget + lazily-created singleton
// controller) is different.
import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:seerah_app/core/app_log.dart';
import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:provider/provider.dart';

// Not referenced from this file directly: GuardBlockActivity (Android)
// launches its own Flutter engine with entrypoint `guardMain`, defined
// there. This import is what keeps that entry-point-annotated function in
// the compiled app (Dart's AOT tree-shaker only retains an
// `@pragma('vm:entry-point')` function if its library is reachable from
// the app's root library at all).
// ignore: unused_import
import 'guard_main.dart';
import 'models/salah_prayer.dart';
import 'navigation.dart';
import 'repositories/prayer_settings_repository.dart';
import 'screens/dua_card_screen.dart';
import 'screens/home_screen.dart';
import 'screens/incoming_salah_screen.dart';
import 'services/geocoding_service.dart';
import 'services/ios_alarmkit_service.dart';
import 'services/ios_app_guard_service.dart';
import 'services/ios_hybrid_notification_scheduler.dart';
import 'services/local_notification_service.dart';
import 'services/location_service.dart';
import 'services/prayer_scheduler_service.dart';
import 'services/prayer_time_service.dart';
import 'services/timezone_service.dart';
import 'state/app_controller.dart';
import '../../core/theme/app_theme.dart' as host_theme;

/// Lazily creates (once) and wires up the Salah [AppController] exactly as
/// the standalone app's `main()` did, then caches it for the lifetime of
/// the process. First entry into the Salah tab pays the (small) init cost;
/// every later entry reuses the same controller/instance so notification
/// scheduling, the midnight timer, etc. are never duplicated.
class SalahBootstrap {
  SalahBootstrap._();

  static Future<AppController>? _future;

  static Future<AppController> ensure() => _future ??= _create();

  static Future<AppController> _create() async {
    TimezoneService.ensureInitialized();

    // Never throws/crashes (see AppConfig docs in the standalone app) — any
    // config validation issue is logged to the in-app diagnostics log, not
    // surfaced here, matching the standalone app's own startup behavior.
    final repository = await PrayerSettingsRepository.create();

    final prayerTimeService = PrayerTimeService();
    final notificationService = LocalNotificationService();
    final timezoneService = TimezoneService();

    // iOS 26+: primary prayer alerts go through AlarmKit when authorized;
    // Android and older iOS keep the existing local-notification path.
    final IosAlarmKitService? alarmKitService =
        (!kIsWeb && Platform.isIOS) ? IosAlarmKitService() : null;
    final NotificationScheduler notificationScheduler = alarmKitService != null
        ? IosHybridNotificationScheduler(
            notifications: notificationService,
            alarmKit: alarmKitService,
          )
        : notificationService;

    final iosAppGuardService =
        (!kIsWeb && Platform.isIOS) ? IosAppGuardService() : null;

    final controller = AppController(
      repository: repository,
      prayerTimeService: prayerTimeService,
      locationService: LocationService(),
      timezoneService: timezoneService,
      notificationService: notificationService,
      notificationScheduler: notificationScheduler,
      alarmKitService: alarmKitService,
      iosAppGuardService: iosAppGuardService,
      schedulerService: PrayerSchedulerService(
        prayerTimeService: prayerTimeService,
        notificationScheduler: notificationScheduler,
        repository: repository,
        iosAppGuardService: iosAppGuardService,
      ),
      geocodingService: GeocodingService(
        prefs: repository.prefs,
        timezoneService: timezoneService,
      ),
    );

    // Re-entrancy guard: the incoming call screen can be requested by two
    // paths at nearly the same moment.
    var incomingScreenOpen = false;

    Future<NavigatorState?> waitForNavigator({
      Duration timeout = const Duration(seconds: 8),
    }) async {
      final deadline = DateTime.now().add(timeout);
      while (DateTime.now().isBefore(deadline)) {
        // The root navigator (not salahNavigatorKey) so the call screen
        // auto-presents no matter which bottom-nav tab is currently
        // showing — the Salah tab's own Navigator only exists while that
        // tab's subtree happens to be mounted, which is not the case right
        // after a cold start (the app always lands back on Seerah) or
        // whenever the user is simply on a different tab when a prayer
        // enters. See navigation.dart's rootNavigatorKey doc comment.
        final nav = rootNavigatorKey.currentState;
        if (nav != null && nav.mounted) return nav;
        await Future<void>.delayed(const Duration(milliseconds: 50));
      }
      return rootNavigatorKey.currentState;
    }

    Future<void> presentIncomingScreen(
      SalahPrayer prayer, {
      DateTime? scheduledAt,
      String? alarmId,
    }) async {
      // The user has turned the full-screen call UI off in Settings. The
      // ordinary notification (with its own Pray Now / Decline actions)
      // still fired independently of this call chain — see
      // LocalNotificationService.schedulePrayerReminder — so there is
      // nothing further to do here.
      if (!controller.settings.callScreenEnabled) return;
      if (incomingScreenOpen) return;
      incomingScreenOpen = true;
      try {
        final nav = await waitForNavigator();
        if (nav == null || !nav.mounted) {
          debugPrint(
            'Incoming salah screen skipped: navigator not ready '
            '(prayer=${prayer.name})',
          );
          AppLog.warn('Incoming call screen skipped: navigator not ready', {
            'prayer': prayer.name,
          });
          return;
        }
        final shownAt = DateTime.now();
        final result = await nav.push<IncomingSalahResult>(
          MaterialPageRoute(
            builder: (_) => IncomingSalahScreen(
              prayer: prayer,
              scheduledAt: scheduledAt,
              alarmId: alarmId,
              // Explicit: this route is pushed on the root navigator, which
              // can be built before the AppController provider is mounted in
              // main.dart (it only appears once SalahBootstrap finishes), so
              // the screen must not depend on a Provider lookup here.
              controller: controller,
            ),
            fullscreenDialog: true,
          ),
        );
        AppLog.info('Incoming call screen closed', {
          'prayer': prayer.name,
          'result': result?.name ?? 'dismissed',
          'seconds_on_screen': DateTime.now().difference(shownAt).inSeconds,
          'from_alarmkit': alarmId != null,
        });
        switch (result) {
          case IncomingSalahResult.prayNow:
            await controller.markPrayerAnswered(prayer);
          case IncomingSalahResult.declined:
            break;
          case null:
            await controller.markPrayerDismissed(prayer);
        }
      } finally {
        incomingScreenOpen = false;
      }
    }

    Future<void> presentFromAlarmKit(AlarmKitAnswer answer) async {
      await alarmKitService?.clearPendingAnswer();
      await presentIncomingScreen(
        answer.prayer,
        scheduledAt: answer.scheduledAt,
        alarmId: answer.alarmId,
      );
    }

    // Du'a for loved ones: the tap opens a calm, timed card for the person
    // the reminder named. Pushed on the root navigator like the call screen,
    // so it shows whichever tab the app is on (or cold-started into).
    var duaCardOpen = false;
    Future<void> presentDuaCard(SalahNotificationPayload payload) async {
      if (duaCardOpen) return;
      duaCardOpen = true;
      try {
        final nav = await waitForNavigator();
        if (nav == null || !nav.mounted) {
          AppLog.warn('Du\'a card skipped: navigator not ready');
          return;
        }
        final id = payload.duaPersonId;
        final people = controller.duaPeople;
        final matchedIndex =
            id == null ? -1 : people.indexWhere((p) => p.id == id);
        final startIndex = matchedIndex == -1 ? 0 : matchedIndex;
        AppLog.info('Du\'a card opened', {
          'matched_notification_person': matchedIndex != -1,
          'person_id_in_payload': id != null,
          'people_count': people.length,
          'full_screen_setting': controller.settings.duaFullScreenEnabled,
        });
        await nav.push<void>(
          MaterialPageRoute(
            builder:
                (_) => DuaCardScreen(
                  people: people,
                  seconds: controller.settings.duaCardSeconds,
                  startIndex: startIndex,
                ),
            fullscreenDialog: true,
          ),
        );
      } finally {
        duaCardOpen = false;
      }
    }

    controller.onOpenReminder = (payload, actionId) async {
      if (payload.type == SalahNotificationPayload.typeDua) {
        await presentDuaCard(payload);
        return;
      }
      final prayer = payload.prayer ?? SalahPrayer.dhuhr;
      // Refresh and Duha/Qiyam reminders just open the app — never the
      // Answer/Decline call screen.
      if (payload.type == SalahNotificationPayload.typeRefresh ||
          payload.type == SalahNotificationPayload.typeVoluntary) {
        return;
      }
      if (actionId == LocalNotificationService.actionPrayNow) {
        if (defaultTargetPlatform == TargetPlatform.iOS &&
            controller.settings.callScreenEnabled) {
          await presentIncomingScreen(prayer);
        } else {
          // Android always answers directly from the notification action;
          // iOS does the same when the full-screen call UI is turned off.
          await controller.markPrayerAnswered(prayer);
        }
        return;
      }
      await presentIncomingScreen(prayer);
    };

    controller.onPrayerEntered = (prayer) => presentIncomingScreen(prayer);
    controller.onPendingIncomingCall = (prayer) => presentIncomingScreen(prayer);

    if (alarmKitService != null) {
      alarmKitService.ensureListening();
      alarmKitService.onAnswered.listen(presentFromAlarmKit);
      controller.onAlarmKitAnswer = presentFromAlarmKit;
    }

    await controller.initialize();

    final pending = await alarmKitService?.getPendingAnswer();
    if (pending != null) {
      // Deferred until the first frame of the Salah section itself mounts.
      scheduleMicrotask(() => presentFromAlarmKit(pending));
    }

    return controller;
  }
}

/// The embeddable Salah section: its own [Navigator] (so Settings / Qibla /
/// the incoming-call screen push the same way they did as a standalone app),
/// defaulting to the host app's black/gold [host_theme.AppTheme], wrapped in
/// a [ChangeNotifierProvider] exposing the shared [AppController].
///
/// Mounted as the `/salah` tab's body. Quran is a sibling `/quran` tab.
class SalahSection extends StatelessWidget {
  const SalahSection({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AppController>(
      future: SalahBootstrap.ensure(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          debugPrint('Salah section failed to initialize: ${snapshot.error}');
          AppLog.error('Salah section failed to initialize', {
            'error_type': snapshot.error.runtimeType.toString(),
            'error': snapshot.error.toString(),
          });
          return const Scaffold(
            backgroundColor: Colors.black,
            body: Center(
              child: Text(
                'Prayer times are unavailable right now.',
                style: TextStyle(color: Colors.white70),
              ),
            ),
          );
        }
        if (!snapshot.hasData) {
          return const Scaffold(
            backgroundColor: Colors.black,
            body: Center(
              child: CircularProgressIndicator(color: Colors.white70),
            ),
          );
        }
        final controller = snapshot.data!;
        return ChangeNotifierProvider<AppController>.value(
          value: controller,
          // Default to the host app's black/gold theme throughout the Salah
          // section. Settings deliberately opts back into the original
          // "Allah Is Calling" white/green look — see settings_screen.dart.
          child: Theme(
            data: host_theme.AppTheme.dark,
            // This tab has its own nested Navigator (below) so Settings /
            // Qibla / reminders / the incoming-call screen push the same
            // way they did as a standalone app. The hardware/gesture back
            // button is wired up to it one level higher, in app_router.dart
            // (_ShellBackHandler) — see the comment there for why a
            // NavigatorPopHandler/PopScope placed here, inside the
            // ShellRoute's own GoRoute page, is never actually consulted by
            // go_router's back handling and silently does nothing.
            child: Navigator(
              key: salahNavigatorKey,
              observers: [salahRouteObserver],
              onGenerateRoute: (settings) => MaterialPageRoute(
                builder: (_) => const HomeScreen(),
              ),
            ),
          ),
        );
      },
    );
  }
}
