import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';

class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final hasAccess = auth.hasAccess;

    return Scaffold(
      appBar: AppBar(title: const Text('My Progress')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.goldFaded, AppColors.surface],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.gold.withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('YOUR JOURNEY',
                  style: TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2)),
                const SizedBox(height: 6),
                const Text('Track Your Seerah Progress',
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(
                  hasAccess
                      ? 'You have full access to all 100 parts. Keep going!'
                      : 'Part 1 is free. Upgrade to unlock all 100 parts.',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.05, end: 0),

          const SizedBox(height: 20),

          // Overview stats
          _OverviewStats(hasAccess: hasAccess)
              .animate(delay: 100.ms).fadeIn(duration: 400.ms),

          const SizedBox(height: 20),

          // Course map - era breakdown
          const _SectionTitle('Course Map'),
          const SizedBox(height: 10),
          _CourseMap(hasAccess: hasAccess)
              .animate(delay: 150.ms).fadeIn(duration: 400.ms),

          const SizedBox(height: 20),

          // Upgrade CTA for free users
          if (!hasAccess) ...[
            _UpgradeCta()
                .animate(delay: 200.ms).fadeIn(duration: 400.ms),
            const SizedBox(height: 20),
          ],

          // Tips
          const _SectionTitle('Learning Tips'),
          const SizedBox(height: 10),
          _LearningTips().animate(delay: 250.ms).fadeIn(duration: 400.ms),

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

// ── Overview Stats ────────────────────────────────────────────────────────────

class _OverviewStats extends StatelessWidget {
  final bool hasAccess;
  const _OverviewStats({required this.hasAccess});

  @override
  Widget build(BuildContext context) {
    final accessible = hasAccess ? 100 : 1;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle('Overview'),
        const SizedBox(height: 10),
        Row(
          children: [
            _StatCard(value: '$accessible', label: 'Parts\nAccessible', color: AppColors.gold),
            const SizedBox(width: 10),
            _StatCard(value: '8', label: 'Eras to\nExplore', color: AppColors.success),
            const SizedBox(width: 10),
            _StatCard(value: '4', label: 'Resource\nTypes', color: const Color(0xFF5A90B0)),
          ],
        ),
        const SizedBox(height: 10),
        // Access bar
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Course Unlocked',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                  Text('${accessible}/100 parts',
                    style: const TextStyle(color: AppColors.gold, fontSize: 13, fontWeight: FontWeight.w700)),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: accessible / 100,
                  backgroundColor: AppColors.border,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.gold),
                  minHeight: 6,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  const _StatCard({required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(
              color: color, fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 4),
            Text(label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w500, height: 1.3)),
          ],
        ),
      ),
    );
  }
}

// ── Course Map ────────────────────────────────────────────────────────────────

class _CourseMap extends StatelessWidget {
  final bool hasAccess;
  const _CourseMap({required this.hasAccess});

  @override
  Widget build(BuildContext context) {
    final groups = getEraGroups();

    return Column(
      children: groups.asMap().entries.map((entry) {
        final i = entry.key;
        final group = entry.value;
        final era = group['era'] as dynamic;
        final parts = group['parts'] as List;
        final color = AppColors.forEra(era.id as String);
        final accessible = hasAccess ? parts.length : (i == 0 ? parts.length : 0);
        final progress = parts.isEmpty ? 0.0 : accessible / parts.length;

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(width: 4, height: 32, decoration: BoxDecoration(
                    color: color, borderRadius: BorderRadius.circular(2))),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(era.name as String,
                          style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700)),
                        Text('${parts.length} parts',
                          style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                  Text('$accessible/${parts.length}',
                    style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700)),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(3),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: AppColors.border,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    hasAccess || i == 0 ? color : AppColors.border),
                  minHeight: 4,
                ),
              ),
            ],
          ),
        );
      }).toList(),
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
          colors: [AppColors.goldDark.withOpacity(0.3), AppColors.goldFaded],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gold.withOpacity(0.4)),
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

// ── Learning Tips ─────────────────────────────────────────────────────────────

class _LearningTips extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const tips = [
      ['Watch first', 'Start each part by watching the video. It gives you the context for everything else.'],
      ['Read after', 'Use the briefing and study guide to review key points from the video.'],
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

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(text, style: const TextStyle(
      color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700));
  }
}
