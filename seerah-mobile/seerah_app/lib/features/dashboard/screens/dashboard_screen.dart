import 'dart:async';

import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart' as provider;
import '../../../core/constants/app_constants.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/models/part_model.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/profile_avatar_button.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../l10n/app_strings.dart';
import '../../salah/salah_section.dart';
import '../../salah/state/app_controller.dart';
import '../../salah/utils/formatting.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(courseLangProvider);
    final auth = ref.watch(authProvider);
    final hasAccess = auth.hasAccess;
    final progressAsync = ref.watch(progressProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        titleSpacing: 16,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const AppLogo(size: 28, borderRadius: 8),
            const SizedBox(width: 10),
            Flexible(
              child: Text(
                t(lang, 'welcomeTitleLine1'),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: const [ProfileAvatarButton()],
      ),
      body: AppGradientBackground(
        child: SafeArea(
          bottom: false,
          child: RefreshIndicator(
            color: AppColors.gold,
            onRefresh: () =>
                ref.read(progressProvider.notifier).manualRefresh(),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                if (progressAsync.valueOrNull?.syncFailed == true)
                  const Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: OfflineBanner(),
                  ),
                _HomeNextPrayerCard(lang: lang),
                const SizedBox(height: 14),
                _HomeContinueCard(
                  hasAccess: hasAccess,
                  progressAsync: progressAsync,
                  lang: lang,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Compact next-prayer row: "Dhuhr in 7 minutes". Taps through to Salah.
class _HomeNextPrayerCard extends StatelessWidget {
  final String lang;
  const _HomeNextPrayerCard({required this.lang});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AppController>(
      future: SalahBootstrap.ensure(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return _DailyCard(
            onTap: () => context.go('/salah'),
            child: SizedBox(
              height: 56,
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.gold,
                  ),
                ),
              ),
            ),
          );
        }
        return provider.ChangeNotifierProvider<AppController>.value(
          value: snapshot.data!,
          child: provider.Consumer<AppController>(
            builder: (context, controller, _) {
              final next = controller.nextPrayer;
              return _DailyCard(
                onTap: () => context.go('/salah'),
                child: next == null
                    ? Row(
                        children: [
                          Icon(
                            Icons.mosque_outlined,
                            color: AppColors.gold,
                            size: 28,
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Text(
                              t(lang, 'prayerTimesUnavailable'),
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          Icon(
                            Icons.chevron_right_rounded,
                            color: AppColors.gold,
                          ),
                        ],
                      )
                    : _NextPrayerCountdown(
                        controller: controller,
                        prayerName: next.key.displayName,
                        target: next.value,
                      ),
              );
            },
          ),
        );
      },
    );
  }
}

class _NextPrayerCountdown extends StatefulWidget {
  final AppController controller;
  final String prayerName;
  final DateTime target;
  const _NextPrayerCountdown({
    required this.controller,
    required this.prayerName,
    required this.target,
  });

  @override
  State<_NextPrayerCountdown> createState() => _NextPrayerCountdownState();
}

class _NextPrayerCountdownState extends State<_NextPrayerCountdown> {
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {});
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
    return Row(
      children: [
        Icon(Icons.mosque_outlined, color: AppColors.gold, size: 28),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.prayerName,
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                remaining.isNegative
                    ? 'now'
                    : 'in ${_friendlyCountdown(remaining)}',
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        Icon(Icons.chevron_right_rounded, color: AppColors.gold),
      ],
    );
  }
}

String _friendlyCountdown(Duration duration) {
  if (duration.inHours > 0) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes % 60;
    if (minutes == 0) return hours == 1 ? '1 hour' : '$hours hours';
    return '${hours}h ${minutes}m';
  }
  if (duration.inMinutes > 0) {
    final minutes = duration.inMinutes;
    return minutes == 1 ? '1 minute' : '$minutes minutes';
  }
  return formatCountdown(duration);
}

/// "Continue Part 15: The First Revelation"
class _HomeContinueCard extends StatelessWidget {
  final bool hasAccess;
  final AsyncValue<ProgressState> progressAsync;
  final String lang;
  const _HomeContinueCard({
    required this.hasAccess,
    required this.progressAsync,
    required this.lang,
  });

  @override
  Widget build(BuildContext context) {
    final lastPartNumber =
        progressAsync.valueOrNull?.lastPartNumber ??
        AppConstants.kFreePartNumber;
    final partNum = lastPartNumber.clamp(1, PARTS.length);
    final isFirstVisit = progressAsync.valueOrNull?.totalViewed == 0;
    final completed =
        progressAsync.valueOrNull?.completedParts ?? const <int>{};
    final nextPartNum =
        (!isFirstVisit &&
            hasAccess &&
            partNum < PARTS.length &&
            completed.contains(partNum))
        ? partNum + 1
        : partNum;
    final PartModel nextPart = PARTS.firstWhere(
      (p) => p.partNumber == nextPartNum,
      orElse: () => PARTS.first,
    );

    return _DailyCard(
      onTap: () => context.push('/part/$nextPartNum'),
      child: Row(
        children: [
          Icon(
            Icons.menu_book_rounded,
            color: AppColors.gold,
            size: 28,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              tv(lang, 'continuePartNamed', {
                'n': nextPartNum,
                'title': nextPart.localizedTitle(lang),
              }),
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w700,
                height: 1.3,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Icon(Icons.chevron_right_rounded, color: AppColors.gold),
        ],
      ),
    );
  }
}

class _DailyCard extends StatelessWidget {
  final VoidCallback onTap;
  final Widget child;
  const _DailyCard({required this.onTap, required this.child});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.gold, width: 1),
          ),
          child: child,
        ),
      ),
    );
  }
}
