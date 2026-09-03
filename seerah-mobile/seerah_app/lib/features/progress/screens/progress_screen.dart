import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/models/part_model.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../l10n/app_strings.dart';

class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final hasAccess = auth.hasAccess;
    final progressAsync = ref.watch(progressProvider);
    final lang = ref.watch(courseLangProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text(t(lang, 'myProgressTitle')),
      ),
      body: AppGradientBackground(
        child: SafeArea(
          // See dashboard_screen.dart's RefreshIndicator for why this exists —
          // previously a failed sync (offline, transient server error) had no
          // manual retry short of force-quitting the app.
          child: RefreshIndicator(
            color: AppColors.gold,
            onRefresh: () =>
                ref.read(progressProvider.notifier).manualRefresh(),
            child: ListView(
              padding: const EdgeInsets.only(bottom: 24),
              children: [
                if (progressAsync.valueOrNull?.syncFailed == true)
                  const Padding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: OfflineBanner(),
                  ),
                // Overview stats
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _OverviewStats(
                    hasAccess: hasAccess,
                    progressAsync: progressAsync,
                    lang: lang,
                  ).animate(delay: 100.ms).fadeIn(duration: 400.ms),
                ),

                SectionHeader(title: t(lang, 'courseMap')),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _CourseMap(
                    hasAccess: hasAccess,
                    progressAsync: progressAsync,
                    lang: lang,
                  ).animate(delay: 150.ms).fadeIn(duration: 400.ms),
                ),

                if (!hasAccess) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _UpgradeCta(lang: lang)
                        .animate(delay: 200.ms)
                        .fadeIn(duration: 400.ms),
                  ),
                  const SizedBox(height: 12),
                ],

                SectionHeader(title: t(lang, 'quickLinks')),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _QuickLinks(lang: lang)
                      .animate(delay: 200.ms)
                      .fadeIn(duration: 400.ms),
                ),

                SectionHeader(title: t(lang, 'learningTips')),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _LearningTips(lang: lang)
                      .animate(delay: 250.ms)
                      .fadeIn(duration: 400.ms),
                ),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Overview Stats ────────────────────────────────────────────────────────────

class _OverviewStats extends StatelessWidget {
  final bool hasAccess;
  final AsyncValue<ProgressState> progressAsync;
  final String lang;
  const _OverviewStats({required this.hasAccess, required this.progressAsync, required this.lang});

  @override
  Widget build(BuildContext context) {
    final progress = progressAsync.valueOrNull;
    final viewed = progress?.totalViewed ?? 0;
    final completed = progress?.totalCompleted ?? 0;
    final totalUnlocked = hasAccess ? PARTS.length : 1;
    // Same denominator (totalUnlocked) as the "Parts Studied" bar below —
    // previously the ring always divided by 100 while the bar used
    // totalUnlocked, so a free user who viewed Part 1 saw "1% complete"
    // in the ring right above a fully-filled "1/1" bar.
    final studiedPercent = totalUnlocked == 0
        ? 0.0
        : (viewed / totalUnlocked).clamp(0.0, 1.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Circular hero ring ─────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
          decoration: AppDecorations.goldHero(),
          child: Row(
            children: [
              Semantics(
                label: tv(lang, 'partsStudiedOfTotal', {'viewed': viewed, 'total': totalUnlocked}),
                value: '${(studiedPercent * 100).round()}%',
                // The CircularPercentIndicator package is a custom-painted
                // widget (unlike Flutter's built-in progress indicators) and
                // doesn't announce a value to screen readers on its own —
                // this wrapper is the only accessible description of the
                // ring for VoiceOver/TalkBack users.
                child: ExcludeSemantics(
                  child: CircularPercentIndicator(
                    radius: 68,
                    lineWidth: 9,
                    percent: studiedPercent,
                    animation: true,
                    animationDuration: 1200,
                    circularStrokeCap: CircularStrokeCap.round,
                    progressColor: AppColors.gold,
                    backgroundColor: AppColors.border,
                    backgroundWidth: 3,
                    center: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '$viewed',
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 30,
                              fontWeight: FontWeight.w800,
                              height: 1,
                              letterSpacing: -1.5,
                            ),
                          ),
                          Text(
                            '/ $totalUnlocked',
                            style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t(lang, 'partsStudied'),
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      tv(lang, 'percentComplete', {'n': (studiedPercent * 100).round()}),
                      style: const TextStyle(
                        color: AppColors.gold,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _MiniStat(
                          value: '$completed',
                          label: t(lang, 'quizzesLabel'),
                          color: AppColors.success,
                        ),
                        const SizedBox(width: 20),
                        _MiniStat(
                          value: '${ERAS.length}',
                          label: t(lang, 'eras'),
                          color: const Color(0xFF5A90B0),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 10),

        // ── Detailed progress bars ─────────────────────────────────────────
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    t(lang, 'partsStudied'),
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '$viewed/$totalUnlocked',
                    style: const TextStyle(
                      color: AppColors.gold,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: totalUnlocked == 0
                      ? 0
                      : (viewed / totalUnlocked).clamp(0.0, 1.0),
                  backgroundColor: AppColors.border,
                  valueColor: const AlwaysStoppedAnimation<Color>(
                    AppColors.gold,
                  ),
                  minHeight: 6,
                ),
              ),
              if (completed > 0) ...[
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      t(lang, 'quizzesPassed'),
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      '$completed/$totalUnlocked',
                      style: const TextStyle(
                        color: AppColors.success,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: totalUnlocked == 0
                        ? 0
                        : (completed / totalUnlocked).clamp(0.0, 1.0),
                    backgroundColor: AppColors.border,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      AppColors.success,
                    ),
                    minHeight: 6,
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  const _MiniStat({
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 20,
            fontWeight: FontWeight.w800,
            height: 1,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            color: AppColors.textMuted,
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

// ── Course Map ────────────────────────────────────────────────────────────────

class _CourseMap extends StatelessWidget {
  final bool hasAccess;
  final AsyncValue<ProgressState> progressAsync;
  final String lang;
  const _CourseMap({required this.hasAccess, required this.progressAsync, required this.lang});

  @override
  Widget build(BuildContext context) {
    final groups = getEraGroups();
    final progress = progressAsync.valueOrNull;

    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Column(
        children: groups.asMap().entries.map((entry) {
          final i = entry.key;
          final isLast = i == groups.length - 1;
          final group = entry.value;
          final era = group['era'] as dynamic;
          final parts = (group['parts'] as List).cast<PartModel>();
          final color = AppColors.forEra(era.id as String);

          // Count how many parts in this era the user has actually viewed.
          final eraPartNumbers = parts.map((p) => p.partNumber).toList();
          final viewedCount = progress?.viewedInEra(eraPartNumbers) ?? 0;
          final completedCount = progress?.completedInEra(eraPartNumbers) ?? 0;
          final isUnlocked = hasAccess || i == 0;
          final displayCount = isUnlocked ? viewedCount : 0;
          final fraction = parts.isEmpty
              ? 0.0
              : (displayCount / parts.length).clamp(0.0, 1.0);

          return Column(
            children: [
              Container(
                color: AppColors.card,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 13,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 4,
                          height: 30,
                          decoration: BoxDecoration(
                            color: isUnlocked ? color : AppColors.border,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            era.localizedName(lang) as String,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: isUnlocked
                                  ? AppColors.textPrimary
                                  : AppColors.textMuted,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        if (completedCount > 0) ...[
                          const Icon(
                            Icons.check_circle_rounded,
                            color: AppColors.success,
                            size: 13,
                          ),
                          const SizedBox(width: 4),
                        ],
                        Text(
                          isUnlocked
                              ? '$viewedCount/${parts.length}'
                              : t(lang, 'locked'),
                          style: TextStyle(
                            color: isUnlocked ? color : AppColors.textMuted,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: fraction,
                        backgroundColor: AppColors.border,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isUnlocked ? color : AppColors.border,
                        ),
                        minHeight: 4,
                      ),
                    ),
                  ],
                ),
              ),
              if (!isLast)
                const Divider(
                  height: 1,
                  thickness: 1,
                  color: AppColors.border,
                  indent: 20,
                  endIndent: 0,
                ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

// ── Upgrade CTA ───────────────────────────────────────────────────────────────

class _UpgradeCta extends StatelessWidget {
  final String lang;
  const _UpgradeCta({required this.lang});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.goldDark.withValues(alpha: 0.3),
            AppColors.goldFaded,
          ],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lock_open_outlined, color: AppColors.gold, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  t(lang, 'unlockFullProgress'),
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            tv(lang, 'unlockFullProgressBody', {'parts': PARTS.length, 'eras': ERAS.length}),
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
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: AppColors.background,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text(
                t(lang, 'viewPlans'),
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Quick Links ───────────────────────────────────────────────────────────────

class _QuickLinks extends StatelessWidget {
  final String lang;
  const _QuickLinks({required this.lang});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _QuickLinkCard(
          icon: Icons.quiz_rounded,
          label: t(lang, 'quizHistory'),
          subtitle: t(lang, 'seeAllScores'),
          onTap: () => context.push('/quiz-history'),
        ),
        const SizedBox(width: 10),
        _QuickLinkCard(
          icon: Icons.workspace_premium_rounded,
          label: t(lang, 'certificate'),
          subtitle: t(lang, 'viewRequirements'),
          onTap: () => context.push('/certificate'),
        ),
      ],
    );
  }
}

class _QuickLinkCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  const _QuickLinkCard({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Ink(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: AppColors.goldFaded,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: AppColors.gold, size: 20),
                ),
                const SizedBox(height: 10),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Learning Tips ─────────────────────────────────────────────────────────────

class _LearningTips extends StatelessWidget {
  final String lang;
  const _LearningTips({required this.lang});

  @override
  Widget build(BuildContext context) {
    final tips = [
      [t(lang, 'tipWatchFirstTitle'), t(lang, 'tipWatchFirstBody')],
      [t(lang, 'tipListenGoTitle'), t(lang, 'tipListenGoBody')],
      [t(lang, 'tipReadBriefingTitle'), t(lang, 'tipReadBriefingBody')],
      [t(lang, 'tipStudySlidesTitle'), t(lang, 'tipStudySlidesBody')],
      [t(lang, 'tipCheckMindmapTitle'), t(lang, 'tipCheckMindmapBody')],
      [t(lang, 'tipReviewFlashcardsTitle'), t(lang, 'tipReviewFlashcardsBody')],
      [t(lang, 'tipTestYourselfTitle'), t(lang, 'tipTestYourselfBody')],
      [t(lang, 'tipGoInOrderTitle'), t(lang, 'tipGoInOrderBody')],
    ];

    return Column(
      children: tips.asMap().entries.map((e) {
        final tip = e.value;
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: AppColors.goldFaded,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '${e.key + 1}',
                    style: const TextStyle(
                      color: AppColors.gold,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
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
                      tip[0],
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      tip[1],
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
