import 'dart:async';

import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import '../utils/quran_l10n.dart';
import 'package:hijri/hijri_calendar.dart';
import 'package:provider/provider.dart';

import '../models/salah_prayer.dart';
import '../services/location_service.dart';
import '../state/app_controller.dart';
import '../utils/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../utils/formatting.dart';
import '../widgets/location_feedback.dart';
import '../widgets/place_text.dart';
import '../widgets/prayer_times_list.dart';
import 'dua_reminders_screen.dart';
import 'manual_location_screen.dart';
import 'qibla_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _guidanceFlowStarted = false;

  /// One-time onboarding guidance shown after initialization: first the
  /// Android full-screen intent explanation (only on Android versions that
  /// actually require the special permission), then (on aggressive OEMs)
  /// the battery reliability tips.
  Future<void> _runOnboardingGuidance(AppController controller) async {
    final needsFsiGuidance = await controller.needsFullScreenGuidance();
    if (needsFsiGuidance && mounted) {
      final proceed = await showDialog<bool>(
        context: context,
        builder:
            (dialogContext) => AlertDialog(
              title: const Text(AppStrings.fullScreenGuidanceTitle),
              content: const Text(AppStrings.fullScreenGuidanceBody),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: const Text('Not now'),
                ),
                FilledButton(
                  onPressed: () => Navigator.of(dialogContext).pop(true),
                  child: const Text('Continue'),
                ),
              ],
            ),
      );
      if (proceed == true) {
        await controller.acceptFullScreenGuidance();
      } else {
        await controller.dismissFullScreenGuidance();
      }
    }

    final needsOverlayGuidance = await controller.needsOverlayGuidance();
    if (needsOverlayGuidance && mounted) {
      final proceed = await showDialog<bool>(
        context: context,
        builder:
            (dialogContext) => AlertDialog(
              title: const Text('Make prayer alerts pop up automatically'),
              content: const Text(
                'Right now, "Allah is calling" only shows as a notification '
                'you have to tap when a prayer enters — unless your phone is '
                'locked. Turning on "Display over other apps" makes it pop '
                'up by itself every time, no tap needed.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: const Text('Not now'),
                ),
                FilledButton(
                  onPressed: () => Navigator.of(dialogContext).pop(true),
                  child: const Text('Turn on'),
                ),
              ],
            ),
      );
      if (proceed == true) {
        await controller.acceptOverlayGuidance();
      } else {
        await controller.dismissOverlayGuidance();
      }
    }

    final manufacturer = await controller.pendingBatteryGuidance();
    if (manufacturer != null && mounted) {
      await showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        builder:
            (sheetContext) => SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.battery_alert_outlined,
                          color: AppColors.gold,
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            AppStrings.batteryGuidanceTitle,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(AppStrings.batteryGuidanceBody),
                    const SizedBox(height: 8),
                    Text(
                      '$manufacturer devices may silence scheduled reminders to '
                      'save battery. Look for "Battery" or "Background activity" '
                      'in this app\'s system settings and remove restrictions.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.of(sheetContext).pop(),
                            child: const Text('Got it'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: FilledButton(
                            onPressed: () {
                              Navigator.of(sheetContext).pop();
                              LocationService().openAppSettings();
                            },
                            child: const Text('Open settings'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
      );
      await controller.markBatteryGuidanceShown();
    }

    final needsAlarmKitGuidance = await controller.needsAlarmKitGuidance();
    if (needsAlarmKitGuidance && mounted) {
      // Apple Guideline 5.1.1(iv): a custom pre-permission message must
      // always lead into the real system permission request — no button
      // wording that implies the permission is already granted (like "Turn
      // On"), and no way to dismiss the message without being taken to the
      // actual prompt. So this is a single non-dismissible "Continue" button
      // rather than a Turn On / Not Now choice; declining now still works
      // fine via the system dialog's own "Don't Allow", and the persistent
      // _AlarmKitBanner below offers another chance later regardless.
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder:
            (dialogContext) => AlertDialog(
              title: const Text(AppStrings.alarmKitGuidanceTitle),
              content: const Text(AppStrings.alarmKitGuidanceBody),
              actions: [
                FilledButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Continue'),
                ),
              ],
            ),
      );
      await controller.acceptAlarmKitGuidance();
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<AppController>();

    if (controller.initialized && !_guidanceFlowStarted) {
      _guidanceFlowStarted = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _runOnboardingGuidance(controller);
      });
    }

    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const Text(
          AppStrings.homeTitle,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: sl(context, 'Settings'),
            onPressed:
                () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const SettingsScreen()),
                ),
          ),
        ],
      ),
      body:
          !controller.initialized
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                onRefresh: controller.recalculateAndReschedule,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _HijriDateLine(controller: controller),
                    const SizedBox(height: 10),
                    if (controller.shouldShowAlarmKitBanner) ...[
                      _AlarmKitBanner(controller: controller),
                      const SizedBox(height: 16),
                    ],
                    if (controller.shouldShowCallScreenOverlayBanner) ...[
                      _CallScreenOverlayBanner(controller: controller),
                      const SizedBox(height: 16),
                    ],
                    _NextPrayerCard(controller: controller),
                    const SizedBox(height: 16),
                    if (controller.pendingCompletionPrayer != null) ...[
                      _CompletionCard(
                        controller: controller,
                        prayer: controller.pendingCompletionPrayer!,
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (controller.today != null) ...[
                      Card(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: AppColors.gold, width: 1),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Today',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ),
                                  Material(
                                    color: AppColors.gold.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(20),
                                    child: InkWell(
                                      onTap: () => Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => const QiblaScreen(),
                                        ),
                                      ),
                                      borderRadius: BorderRadius.circular(20),
                                      child: Padding(
                                        padding: EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 6,
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              Icons.explore_outlined,
                                              size: 16,
                                              color: AppColors.gold,
                                            ),
                                            SizedBox(width: 6),
                                            Text(
                                              'Qibla',
                                              style: TextStyle(
                                                color: AppColors.gold,
                                                fontSize: 13,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              PrayerTimesList(
                                day: controller.today!,
                                highlighted: controller.nextPrayer?.key,
                                voluntaryTimes: controller.voluntaryTimes,
                                now: controller.nowInUserZone(),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _DuaEntryCard(controller: controller),
                    ] else
                      _LocationNeededCard(controller: controller),
                  ],
                ),
              ),
    );
  }
}

/// Hijri (Islamic) date alongside the Gregorian date, computed in the
/// user's prayer timezone so the day flips at the right local midnight.
/// The user's Hijri adjustment (±2 days, for local moon sighting) applies
/// only to this display — never to salah calculations.
class _HijriDateLine extends StatelessWidget {
  final AppController controller;

  const _HijriDateLine({required this.controller});

  @override
  Widget build(BuildContext context) {
    final now = controller.nowInUserZone();
    final hijri = HijriCalendar.fromDate(
      now.add(Duration(days: controller.settings.hijriAdjustmentDays)),
    );
    return Center(
      child: Text(
        '${hijri.hDay} ${hijri.longMonthName} ${hijri.hYear} AH'
        '  •  ${formatDate(now)}',
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.gold,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

class _NextPrayerCard extends StatelessWidget {
  final AppController controller;

  const _NextPrayerCard({required this.controller});

  @override
  Widget build(BuildContext context) {
    final next = controller.nextPrayer;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.gold, width: 1),
      ),
      child:
          next == null
              ? Text(
                'Prayer times unavailable.\nPlease set your location.',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 16),
                textAlign: TextAlign.center,
              )
              : Column(
                children: [
                  Text(
                    'Next Prayer',
                    style: TextStyle(
                      color: AppColors.gold,
                      fontSize: 14,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    next.key.displayName,
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 40,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    formatTime(next.value),
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 22,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.gold),
                    ),
                    child: _CountdownText(
                      controller: controller,
                      target: next.value,
                    ),
                  ),
                  if (controller.settings.locationLabel != null) ...[
                    const SizedBox(height: 12),
                    PlaceText(
                      controller.settings.locationLabel!,
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
    );
  }
}

/// Self-ticking countdown. Owns its own one-second timer so the rest of the
/// screen (and the astronomical calculations behind it) are not rebuilt
/// every second; the controller's memoized next-prayer stays untouched
/// until this countdown actually reaches zero.
class _CountdownText extends StatefulWidget {
  final AppController controller;
  final DateTime target;

  const _CountdownText({required this.controller, required this.target});

  @override
  State<_CountdownText> createState() => _CountdownTextState();
}

class _CountdownTextState extends State<_CountdownText> {
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {});
      // Countdown finished: the next prayer changed. Nudge the controller
      // so the whole card (name, time, highlight) refreshes once.
      if (!widget.target.isAfter(widget.controller.nowInUserZone())) {
        widget.controller.refreshNextPrayer();
      }
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final remaining = widget.target.difference(
      widget.controller.nowInUserZone(),
    );
    return Text(
      'in ${formatCountdown(remaining)}',
      style: TextStyle(
        color: AppColors.textPrimary,
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}

/// Gentle, non-intrusive completion check-in: shown on the home screen only
/// after the user answered a reminder, a respectful delay has passed, and
/// the prayer window is still open. Never a second full-screen interruption.
class _CompletionCard extends StatelessWidget {
  final AppController controller;
  final SalahPrayer prayer;

  const _CompletionCard({required this.controller, required this.prayer});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        child: Row(
          children: [
            Icon(Icons.check_circle_outline, color: AppColors.gold),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                AppStrings.didYouComplete(prayer.displayName),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
            TextButton(
              onPressed: () => controller.markPrayerCompleted(prayer),
              child: const Text('Mark as Prayed'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Persistent (non-dismissible) nudge shown on Home while iOS AlarmKit
/// ("Prayer Alarms") is available on this device but not yet authorized.
/// Deliberately more prominent than a one-time dialog: this is the closest
/// this app can get to a lock-screen call-style alert on iOS, and it is
/// easy to miss or postpone forever if it only appears once at first launch.
class _AlarmKitBanner extends StatelessWidget {
  final AppController controller;

  const _AlarmKitBanner({required this.controller});

  @override
  Widget build(BuildContext context) {
    final denied = controller.alarmKitAuthStatus == 'denied';
    return Card(
      color: Colors.orange.shade50,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.orange.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.alarm_off_outlined, color: Colors.orange.shade800),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    denied
                        ? AppStrings.alarmKitBannerTitleDenied
                        : AppStrings.alarmKitBannerTitleOff,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: Colors.orange.shade900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    denied
                        ? AppStrings.alarmKitBannerBodyDenied
                        : AppStrings.alarmKitBannerBodyOff,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade700,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.orange.shade800,
                      ),
                      onPressed: () async {
                        final messenger = ScaffoldMessenger.of(context);
                        if (denied) {
                          await controller.openAlarmKitSettings();
                          return;
                        }
                        final status = await controller
                            .requestAlarmKitPermission();
                        if (!context.mounted) return;
                        messenger.showSnackBar(
                          SnackBar(
                            content: Text(
                              status == 'authorized'
                                  ? 'Prayer Alarms enabled.'
                                  : 'Prayer Alarms not enabled.',
                            ),
                          ),
                        );
                      },
                      child: Text(denied ? 'Open Settings' : 'Enable'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Persistent (non-dismissible) nudge shown on Home (Android) when
/// "Display over other apps" isn't granted. Without it, Android only
/// auto-presents the full-screen "Allah is calling" call UI while the
/// device is locked — otherwise it silently downgrades to a heads-up
/// notification the user has to tap, which looks exactly like a bug.
/// Surfacing it here, not just in Settings, is deliberate: it's otherwise
/// invisible until the moment a prayer enters and it doesn't work.
class _CallScreenOverlayBanner extends StatelessWidget {
  final AppController controller;

  const _CallScreenOverlayBanner({required this.controller});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.orange.shade50,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.orange.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.phone_in_talk_outlined, color: Colors.orange.shade800),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'One more step for prayer alerts',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: Colors.orange.shade900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Without "Display over other apps", the call screen only '
                    'pops up by itself while your phone is locked — otherwise '
                    'it\'s just a notification you have to tap. Grant it so '
                    '"Allah is calling" always shows automatically.',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                  ),
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.orange.shade800,
                      ),
                      onPressed: () async {
                        await controller.requestCallScreenOverlayPermission();
                        await controller.refreshReliableCallScreenPermission();
                      },
                      child: const Text('Enable'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Entry point to "Du'a for loved ones" (the righteous-child reminder): a
/// quiet card under today's prayer times. Taps through to the setup screen.
class _DuaEntryCard extends StatelessWidget {
  final AppController controller;

  const _DuaEntryCard({required this.controller});

  @override
  Widget build(BuildContext context) {
    final on = controller.settings.duaReminderEnabled;
    final count = controller.duaPeople.length;
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppColors.gold.withValues(alpha: 0.5)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap:
            () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const DuaRemindersScreen()),
            ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(Icons.favorite_border, color: AppColors.gold),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Du\'a for loved ones',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      on
                          ? 'On — $count ${count == 1 ? 'person' : 'people'}'
                          : 'Never forget to pray for your parents and the '
                              'people you love',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}

class _LocationNeededCard extends StatelessWidget {
  final AppController controller;

  const _LocationNeededCard({required this.controller});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(
              Icons.location_on_outlined,
              size: 40,
              color: AppColors.gold,
            ),
            const SizedBox(height: 12),
            const Text(
              AppStrings.useLocationPrompt,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            Text(
              'Prayer times are calculated from your coordinates, so the '
              'closer the location, the more accurate the times.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () async {
                final status = await controller.useCurrentLocation();
                if (!context.mounted) return;
                showLocationStatusFeedback(context, status);
              },
              icon: const Icon(Icons.my_location),
              label: const Text('Use current location'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed:
                  () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const ManualLocationScreen(),
                    ),
                  ),
              icon: const Icon(Icons.search, size: 18),
              label: const Text(AppStrings.searchYourCity),
            ),
            TextButton(
              onPressed:
                  () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const ManualLocationScreen(initialTab: 1),
                    ),
                  ),
              child: const Text(AppStrings.enterCoordinatesManually),
            ),
          ],
        ),
      ),
    );
  }
}

