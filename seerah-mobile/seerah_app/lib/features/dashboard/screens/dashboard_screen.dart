import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/models/part_model.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/providers/profiles_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../l10n/app_strings.dart';
import '../../resources/screens/resources_screen.dart' show kResourceTypeCount;

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(courseLangProvider);
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final hasAccess = auth.hasAccess;
    final progressAsync = ref.watch(progressProvider);
    final profilesState = ref.watch(profilesProvider).valueOrNull;
    final activeProfile = profilesState?.activeProfile;
    // On a family plan, `user.name` is the ACCOUNT holder (e.g. the parent
    // who signed up/pays) — but the person actually using the app right now
    // is whichever learner profile is active, which can be a different
    // family member entirely. Greeting them by the account owner's name was
    // confusing/wrong for every non-default profile. activeProfile.displayName
    // is always populated (defaults to the account holder's name for the
    // single-profile/individual-plan case — see lib/access.ts's
    // ensureFamilyProfilesForUser and app/actions/profiles.ts's
    // createDefaultProfileForUser), so it's a safe, always-correct source for
    // BOTH individual and family plans.
    final firstName = _firstName(activeProfile?.displayName ?? user?.name, lang);

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
        actions: [
          // Profile switcher — taps go directly to profile picker if multi-profile
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: Semantics(
              button: true,
              label: t(lang, 'profile'),
              child: InkResponse(
                onTap: () {
                  if (profilesState != null &&
                      profilesState.hasMultipleProfiles) {
                    context.push('/profiles');
                  } else {
                    context.push('/profile');
                  }
                },
                radius: 24,
                // Outer padding keeps the visual circle unchanged while giving a >=44dp tap target.
                child: Padding(
                  padding: const EdgeInsets.all(6),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.border),
                    ),
                    child:
                        activeProfile?.avatar != null &&
                            activeProfile!.avatar!.isNotEmpty
                        ? Text(
                            activeProfile.avatar!,
                            style: const TextStyle(fontSize: 16),
                            textAlign: TextAlign.center,
                          )
                        : const Icon(
                            Icons.person_outline_rounded,
                            size: 20,
                            color: AppColors.textPrimary,
                          ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: AppGradientBackground(
        child: SafeArea(
          // Previously the ONLY way to recover from a sync failure (offline,
          // transient server error — see progress_provider.dart's syncFailed)
          // was to force-quit and relaunch the app; there was no manual retry
          // affordance anywhere. Pull-to-refresh re-runs the same awaited
          // sync/push round-trip manualRefresh() exposes.
          child: RefreshIndicator(
            color: AppColors.gold,
            onRefresh: () =>
                ref.read(progressProvider.notifier).manualRefresh(),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(0, 4, 0, 32),
              children: [
                if (progressAsync.valueOrNull?.syncFailed == true)
                  const Padding(
                    padding: EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: OfflineBanner(),
                  ),
                // ── Welcome hero ───────────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  child:
                      _WelcomeCard(firstName: firstName, hasAccess: hasAccess)
                          .animate()
                          .fadeIn(duration: 400.ms)
                          .slideY(begin: -0.05, end: 0),
                ),

                // ── At-a-glance stats strip ────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: progressAsync.when(
                      loading: () => Row(
                        children: [
                          _InlineStat(
                            value: '${PARTS.length}',
                            label: t(lang, 'partsLabel'),
                            color: AppColors.gold,
                          ),
                          _StatDivider(),
                          _InlineStat(
                            value: '${ERAS.length}',
                            label: t(lang, 'eras'),
                            color: AppColors.success,
                          ),
                          _StatDivider(),
                          _InlineStat(
                            value: '$kResourceTypeCount',
                            label: t(lang, 'resources'),
                            color: const Color(0xFF5A90B0),
                          ),
                          _StatDivider(),
                          _InlineStat(
                            value: '∞',
                            label: t(lang, 'reference'),
                            color: const Color(0xFF4AA87E),
                          ),
                        ],
                      ),
                      error: (_, __) => Row(
                        children: [
                          _InlineStat(
                            value: '${PARTS.length}',
                            label: t(lang, 'partsLabel'),
                            color: AppColors.gold,
                          ),
                          _StatDivider(),
                          _InlineStat(
                            value: '${ERAS.length}',
                            label: t(lang, 'eras'),
                            color: AppColors.success,
                          ),
                          _StatDivider(),
                          _InlineStat(
                            value: '$kResourceTypeCount',
                            label: t(lang, 'resources'),
                            color: const Color(0xFF5A90B0),
                          ),
                          _StatDivider(),
                          _InlineStat(
                            value: '∞',
                            label: t(lang, 'reference'),
                            color: const Color(0xFF4AA87E),
                          ),
                        ],
                      ),
                      data: (progress) => Row(
                        children: [
                          _InlineStat(
                            value: '${progress.totalViewed}',
                            label: t(lang, 'studied'),
                            color: AppColors.gold,
                          ),
                          _StatDivider(),
                          _InlineStat(
                            value: '${progress.totalCompleted}',
                            label: t(lang, 'completed'),
                            color: AppColors.success,
                          ),
                          _StatDivider(),
                          _InlineStat(
                            value: '$kResourceTypeCount',
                            label: t(lang, 'resources'),
                            color: const Color(0xFF5A90B0),
                          ),
                          _StatDivider(),
                          _InlineStat(
                            value: '∞',
                            label: t(lang, 'reference'),
                            color: const Color(0xFF4AA87E),
                          ),
                        ],
                      ),
                    ),
                  ).animate(delay: 70.ms).fadeIn(duration: 400.ms),
                ),

                // ── Continue learning ──────────────────────────────────────────
                SectionHeader(
                  title: t(lang, 'continueLearningTitle'),
                  subtitle: t(lang, 'pickUpWhereLeftOff'),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _ContinueLearningCard(
                    hasAccess: hasAccess,
                    progressAsync: progressAsync,
                    lang: lang,
                  ).animate(delay: 120.ms).fadeIn(duration: 400.ms),
                ),

                // ── Quick access ───────────────────────────────────────────────
                SectionHeader(title: t(lang, 'quickAccess')),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _QuickAccessGrid(lang: lang)
                      .animate(delay: 160.ms)
                      .fadeIn(duration: 400.ms),
                ),

                // ── Upgrade prompt ─────────────────────────────────────────────
                if (!hasAccess) ...[
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _UpgradeBanner(lang: lang)
                        .animate(delay: 200.ms)
                        .fadeIn(duration: 400.ms),
                  ),
                ],

                // ── Era overview ───────────────────────────────────────────────
                SectionHeader(
                  title: t(lang, 'courseOverview'),
                  subtitle: tv(lang, 'allErasOfSeerah', {'n': ERAS.length}),
                ),
                _EraOverviewList(
                  hasAccess: hasAccess,
                  lang: lang,
                ).animate(delay: 240.ms).fadeIn(duration: 400.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _firstName(String? name, String lang) {
    if (name == null || name.isEmpty) return t(lang, 'student');
    return name.trim().split(' ').first;
  }
}

// ── Welcome hero card ─────────────────────────────────────────────────────────

class _WelcomeCard extends ConsumerWidget {
  final String firstName;
  final bool hasAccess;
  const _WelcomeCard({required this.firstName, required this.hasAccess});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(courseLangProvider);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppDecorations.goldHero(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GoldBadge(t(lang, 'welcomeTitleLine1')),
              const Spacer(),
              Text(
                '✦',
                style: TextStyle(
                  color: AppColors.gold.withValues(alpha: 0.3),
                  fontSize: 20,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            t(lang, 'assalamAlaykum'),
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            firstName,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 28,
              fontWeight: FontWeight.w800,
              height: 1.0,
              letterSpacing: -0.6,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Text(
                  hasAccess
                      ? t(lang, 'dashboardIntro')
                      : t(lang, 'dashboardFreeIntro'),
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                    height: 1.45,
                  ),
                ),
              ),
              if (hasAccess) ...[
                const SizedBox(width: 12),
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: AppColors.success.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.check_circle_rounded,
                          color: AppColors.success,
                          size: 11,
                        ),
                        const SizedBox(width: 3),
                        Flexible(
                          child: Text(
                            t(lang, 'fullAccess'),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.success,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

// ── Continue learning card ────────────────────────────────────────────────────

class _ContinueLearningCard extends StatelessWidget {
  final bool hasAccess;
  final AsyncValue<ProgressState> progressAsync;
  final String lang;
  const _ContinueLearningCard({
    required this.hasAccess,
    required this.progressAsync,
    required this.lang,
  });

  @override
  Widget build(BuildContext context) {
    // Use the last visited part from progress; fall back to Part 1 for new users.
    final lastPartNumber = progressAsync.valueOrNull?.lastPartNumber ?? 1;
    final partNum = lastPartNumber.clamp(1, PARTS.length);
    // Only advance to "Up next" once the current furthest part is completed
    // (quiz passed) — don't skip past unfinished work just because it was opened.
    final isFirstVisit = progressAsync.valueOrNull?.totalViewed == 0;
    final completed = progressAsync.valueOrNull?.completedParts ?? const <int>{};
    final nextPartNum = (!isFirstVisit &&
            hasAccess &&
            partNum < PARTS.length &&
            completed.contains(partNum))
        ? partNum + 1
        : partNum;
    final PartModel nextPart = PARTS.firstWhere(
      (p) => p.partNumber == nextPartNum,
      orElse: () => PARTS.first,
    );
    final nextEraColor = AppColors.forEra(nextPart.era);

    // A previously-subscribed user whose access has since lapsed keeps their
    // real (possibly > 1) lastPartNumber — without this check the card would
    // silently promise "Continue" and then bounce them straight into the
    // paywall on tap, with no indication anything had changed.
    final locked = !hasAccess && nextPartNum > 1;

    final label = isFirstVisit
        ? (hasAccess ? t(lang, 'startHere') : t(lang, 'freeStartHere'))
        : locked
        ? t(lang, 'resumeUnlockContinue')
        : (nextPartNum == partNum ? t(lang, 'continueLabel') : t(lang, 'upNext'));

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push('/part/$nextPartNum'),
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: AppDecorations.eraAccent(nextEraColor),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: nextEraColor.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: nextEraColor.withValues(alpha: 0.4),
                  ),
                ),
                child: Center(
                  child: Text(
                    '$nextPartNum',
                    style: TextStyle(
                      color: nextEraColor,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$label — ${_eraName(nextPart.era, lang)}',
                      style: const TextStyle(
                        color: AppColors.gold,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      nextPart.localizedTitle(lang),
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      nextPart.localizedSubtitle(lang),
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.3),
                  ),
                ),
                child: Icon(
                  locked
                      ? Icons.lock_outline_rounded
                      : Icons.play_arrow_rounded,
                  color: AppColors.gold,
                  size: 20,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Looks up an era's localized display name from its id (as stored on
/// [PartModel.era]) — falls back to the raw id if a new era is ever added
/// to PARTS without a matching ERAS entry.
String _eraName(String eraId, String lang) {
  for (final era in ERAS) {
    if (era.id == eraId) return era.localizedName(lang);
  }
  return eraId;
}

// ── Quick access grid ─────────────────────────────────────────────────────────

class _QuickAccessGrid extends StatelessWidget {
  final String lang;
  const _QuickAccessGrid({required this.lang});

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.menu_book_rounded, t(lang, 'lessons'), '/course', AppColors.gold),
      (
        Icons.folder_rounded,
        t(lang, 'resources'),
        '/resources',
        const Color(0xFF5A90B0),
      ),
      (
        Icons.library_books_rounded,
        t(lang, 'reference'),
        '/reference',
        const Color(0xFF4AA87E),
      ),
      (
        Icons.insights_rounded,
        t(lang, 'myProgress'),
        '/progress',
        const Color(0xFFB08040),
      ),
    ];

    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 2.1,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: items.map((item) {
        return Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => context.go(item.$3),
            borderRadius: BorderRadius.circular(14),
            child: Ink(
              decoration: AppDecorations.card(
                borderColor: item.$4.withValues(alpha: 0.25),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: item.$4.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(item.$1, color: item.$4, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      item.$2,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                    ),
                  ),
                  ForwardChevronIcon(
                    color: item.$4.withValues(alpha: 0.45),
                    size: 11,
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ── Inline stat helpers ───────────────────────────────────────────────────────

class _InlineStat extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  const _InlineStat({
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: color,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 30, color: AppColors.border);
  }
}

// ── Upgrade banner ────────────────────────────────────────────────────────────

class _UpgradeBanner extends StatelessWidget {
  final String lang;
  const _UpgradeBanner({required this.lang});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.goldHero(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.lock_open_rounded,
                  color: AppColors.gold,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  tv(lang, 'unlockAllParts', {'n': PARTS.length}),
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            t(lang, 'unlockAllPartsBody'),
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              // push, not go — consistent with every other "View Plans" /
              // paywall entry point in the app.
              onPressed: () => context.push('/pricing'),
              child: Text(t(lang, 'viewPlans')),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Era overview list ─────────────────────────────────────────────────────────

class _EraOverviewList extends StatelessWidget {
  final bool hasAccess;
  final String lang;
  const _EraOverviewList({required this.hasAccess, required this.lang});

  @override
  Widget build(BuildContext context) {
    final groups = getEraGroups();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Column(
          children: groups.asMap().entries.map((entry) {
            final i = entry.key;
            final isLast = i == groups.length - 1;
            final group = entry.value;
            final era = group['era'] as EraModel;
            final parts = group['parts'] as List;
            final color = AppColors.forEra(era.id);
            return Column(
              children: [
                Material(
                  color: AppColors.card,
                  child: InkWell(
                    onTap: () => context.go('/course'),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 13,
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.16),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: Text(
                                '${i + 1}',
                                style: TextStyle(
                                  color: color,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  era.localizedName(lang),
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  tv(lang, 'nPartsSuffix', {'n': parts.length}),
                                  style: TextStyle(
                                    color: color,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const ForwardChevronIcon(
                            color: AppColors.textMuted,
                            size: 18,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (!isLast)
                  const Divider(
                    height: 1,
                    thickness: 1,
                    color: AppColors.border,
                    indent: 64,
                  ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }
}
