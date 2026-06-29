import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/models/part_model.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_kit.dart';

class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final hasAccess = auth.hasAccess;
    final progressAsync = ref.watch(progressProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('My Progress'),
      ),
      body: AppGradientBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.only(bottom: 24),
            children: [
              // Overview stats
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _OverviewStats(hasAccess: hasAccess, progressAsync: progressAsync)
                .animate(delay: 100.ms).fadeIn(duration: 400.ms),
          ),

          const SectionHeader(title: 'Course Map'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _CourseMap(hasAccess: hasAccess, progressAsync: progressAsync)
                .animate(delay: 150.ms).fadeIn(duration: 400.ms),
          ),

          if (!hasAccess) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _UpgradeCta()
                  .animate(delay: 200.ms).fadeIn(duration: 400.ms),
            ),
            const SizedBox(height: 12),
          ],

          const SectionHeader(title: 'Quick Links'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _QuickLinks().animate(delay: 200.ms).fadeIn(duration: 400.ms),
          ),

          const SectionHeader(title: 'Learning Tips'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _LearningTips().animate(delay: 250.ms).fadeIn(duration: 400.ms),
          ),

          const SizedBox(height: 32),
            ],
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
  const _OverviewStats({required this.hasAccess, required this.progressAsync});

  @override
  Widget build(BuildContext context) {
    final progress = progressAsync.valueOrNull;
    final viewed    = progress?.totalViewed    ?? 0;
    final completed = progress?.totalCompleted ?? 0;
    final totalUnlocked = hasAccess ? 100 : 1;
    final studiedPercent = (viewed / 100).clamp(0.0, 1.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Circular hero ring ─────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
          decoration: AppDecorations.goldHero(),
          child: Row(
            children: [
              CircularPercentIndicator(
                radius: 68,
                lineWidth: 9,
                percent: studiedPercent,
                animation: true,
                animationDuration: 1200,
                circularStrokeCap: CircularStrokeCap.round,
                progressColor: AppColors.gold,
                backgroundColor: AppColors.border,
                backgroundWidth: 3,
                center: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('$viewed',
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 30,
                          fontWeight: FontWeight.w800,
                          height: 1,
                          letterSpacing: -1.5,
                        )),
                    const Text('/ 100',
                        style: TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        )),
                  ],
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Parts Studied',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        )),
                    const SizedBox(height: 4),
                    Text('${(studiedPercent * 100).round()}% complete',
                        style: const TextStyle(
                          color: AppColors.gold,
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.3,
                        )),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _MiniStat(
                            value: '$completed',
                            label: 'Quizzes',
                            color: AppColors.success),
                        const SizedBox(width: 20),
                        const _MiniStat(
                            value: '8',
                            label: 'Eras',
                            color: Color(0xFF5A90B0)),
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
                  const Text('Parts Studied',
                      style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.w600)),
                  Text('$viewed/$totalUnlocked',
                      style: const TextStyle(
                          color: AppColors.gold,
                          fontSize: 13,
                          fontWeight: FontWeight.w700)),
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
                  valueColor:
                      const AlwaysStoppedAnimation<Color>(AppColors.gold),
                  minHeight: 6,
                ),
              ),
              if (completed > 0) ...[
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Quizzes Passed',
                        style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600)),
                    Text('$completed/$totalUnlocked',
                        style: const TextStyle(
                            color: AppColors.success,
                            fontSize: 13,
                            fontWeight: FontWeight.w700)),
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
                    valueColor:
                        const AlwaysStoppedAnimation<Color>(AppColors.success),
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
  const _MiniStat({required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value,
            style: TextStyle(
              color: color,
              fontSize: 20,
              fontWeight: FontWeight.w800,
              height: 1,
            )),
        const SizedBox(height: 2),
        Text(label,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            )),
      ],
    );
  }
}

// ── Course Map ────────────────────────────────────────────────────────────────

class _CourseMap extends StatelessWidget {
  final bool hasAccess;
  final AsyncValue<ProgressState> progressAsync;
  const _CourseMap({required this.hasAccess, required this.progressAsync});

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
          final fraction = parts.isEmpty ? 0.0 : (displayCount / parts.length).clamp(0.0, 1.0);

          return Column(
            children: [
              Container(
                color: AppColors.card,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 4, height: 30,
                          decoration: BoxDecoration(
                            color: isUnlocked ? color : AppColors.border,
                            borderRadius: BorderRadius.circular(2))),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(era.name as String,
                            style: TextStyle(
                              color: isUnlocked
                                  ? AppColors.textPrimary
                                  : AppColors.textMuted,
                              fontSize: 14,
                              fontWeight: FontWeight.w600)),
                        ),
                        if (completedCount > 0) ...[
                          const Icon(Icons.check_circle_rounded,
                            color: AppColors.success, size: 13),
                          const SizedBox(width: 4),
                        ],
                        Text(
                          isUnlocked ? '$viewedCount/${parts.length}' : 'Locked',
                          style: TextStyle(
                            color: isUnlocked ? color : AppColors.textMuted,
                            fontSize: 13,
                            fontWeight: FontWeight.w700)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: fraction,
                        backgroundColor: AppColors.border,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isUnlocked ? color : AppColors.border),
                        minHeight: 4,
                      ),
                    ),
                  ],
                ),
              ),
              if (!isLast)
                const Divider(height: 1, thickness: 1, color: AppColors.border,
                  indent: 20, endIndent: 0),
            ],
          );
        }).toList(),
      ),
    );
  }
}

// ── Upgrade CTA ───────────────────────────────────────────────────────────────

class _UpgradeCta extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.goldDark.withValues(alpha: 0.3), AppColors.goldFaded],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.lock_open_outlined, color: AppColors.gold, size: 20),
              SizedBox(width: 8),
              Text('Unlock Full Progress',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Get access to all 100 parts across 8 eras. Videos, reading, flashcards, and quizzes for every lesson.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => context.go('/pricing'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: AppColors.background,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('View Plans', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Quick Links ───────────────────────────────────────────────────────────────

class _QuickLinks extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _QuickLinkCard(
          icon: Icons.quiz_rounded,
          label: 'Quiz History',
          subtitle: 'See all scores',
          onTap: () => context.push('/quiz-history'),
        ),
        const SizedBox(width: 10),
        _QuickLinkCard(
          icon: Icons.workspace_premium_rounded,
          label: 'Certificate',
          subtitle: 'View requirements',
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
      child: GestureDetector(
        onTap: onTap,
        child: Container(
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
                width: 38, height: 38,
                decoration: BoxDecoration(
                  color: AppColors.goldFaded,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: AppColors.gold, size: 20),
              ),
              const SizedBox(height: 10),
              Text(label,
                style: const TextStyle(
                  color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              Text(subtitle,
                style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Learning Tips ─────────────────────────────────────────────────────────────

class _LearningTips extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const tips = [
      ['Watch first', 'Start each part by watching the video. It gives you the full context and narrative.'],
      ['Listen on the go', 'Use the audio version while commuting or doing other tasks to reinforce what you learned.'],
      ['Read the briefing', 'Go through the briefing notes and key facts to solidify the main points.'],
      ['Study the slides', 'Review the slide decks and infographics for a visual summary of each lesson.'],
      ['Check the mindmap', 'Use the mindmap to see how concepts in a lesson connect to each other.'],
      ['Review with flashcards', 'Go through the flashcards to lock in the most important facts.'],
      ['Test yourself', 'Take the quiz to see what you\'ve truly retained. Aim for 80%+.'],
      ['Go in order', 'The Seerah is a connected story. Each era builds on the one before.'],
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
                width: 24, height: 24,
                decoration: BoxDecoration(
                  color: AppColors.goldFaded,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text('${e.key + 1}',
                    style: const TextStyle(color: AppColors.gold, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(tip[0],
                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 3),
                    Text(tip[1],
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4)),
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

