import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/system_insets.dart';
import '../../../core/widgets/adaptive_icons.dart';

class QuizHistoryScreen extends ConsumerWidget {
  const QuizHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progressAsync = ref.watch(progressProvider);
    // A part quizzed while subscribed stays in this history forever, even
    // after the subscription lapses — gate the row tap the same way every
    // other part-entry-point in the app does (resources_screen, dashboard),
    // rather than relying solely on PartScreen's own paywall to catch it
    // after navigating.
    final hasAccess = ref.watch(authProvider).hasAccess;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: const Text('Quiz History'),
        leading: IconButton(
          icon: const BackIcon(size: 20),
          tooltip: 'Back',
          onPressed: () => context.pop(),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
      ),
      body: progressAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator.adaptive(
            valueColor: AlwaysStoppedAnimation(AppColors.gold),
          ),
        ),
        error: (e, _) => Center(
          child: Text('Failed to load progress', style: const TextStyle(color: AppColors.textSecondary)),
        ),
        data: (progress) {
          // Pre-index parts so each row does an O(1) lookup instead of firstWhere.
          final partByNumber = {for (final p in PARTS) p.partNumber: p};

          // A quizScores key with no matching PartModel is stale/out-of-range
          // data (e.g. left over from a course restructure) — previously this
          // silently fell back to PARTS.first, mislabeling it as Part 1's
          // title/subtitle/era while still showing the real (bogus) part
          // number badge. Drop it from the list entirely instead of lying
          // about what it is.
          final sortedEntries = progress.quizScores.entries
              .where((e) => partByNumber.containsKey(e.key))
              .toList()
            ..sort((a, b) => a.key.compareTo(b.key));

          if (sortedEntries.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.quiz_outlined, size: 56, color: AppColors.textMuted),
                  SizedBox(height: 16),
                  Text('No quizzes taken yet',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 17, fontWeight: FontWeight.w600)),
                  SizedBox(height: 8),
                  Text('Complete a part quiz to see your scores here.',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    textAlign: TextAlign.center),
                ],
              ),
            );
          }

          final total = sortedEntries.length;
          // Derive from the same filtered `sortedEntries` as `total`/`avgScore`
          // rather than the raw `progress.completedParts` set — that set can
          // contain a passing score for a stale/out-of-range part number that
          // was just excluded above, which would let Passed exceed Attempted.
          final passed = sortedEntries.where((e) => e.value >= 80).length;
          final avgScore = sortedEntries.isEmpty
              ? 0
              : (sortedEntries.map((e) => e.value).reduce((a, b) => a + b) / total).round();

          return ListView.builder(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 32 + bottomSystemInset(context)),
            itemCount: sortedEntries.length + 1,
            itemBuilder: (context, index) {
              if (index == 0) {
                // Stats row
                return Padding(
                  padding: const EdgeInsets.only(bottom: 20),
                  child: Row(
                    children: [
                      _StatCard(value: '$total', label: 'Attempted'),
                      const SizedBox(width: 10),
                      _StatCard(value: '$passed', label: 'Passed', color: AppColors.success),
                      const SizedBox(width: 10),
                      _StatCard(value: '$avgScore%', label: 'Avg Score', color: AppColors.gold),
                    ],
                  ),
                );
              }

              final entry = sortedEntries[index - 1];
              final partNum = entry.key;
              final score = entry.value;
              final part = partByNumber[partNum]!;
              final rowPassed = score >= 80;
              final color = AppColors.forEra(part.era);
              final locked = partNum > 1 && !hasAccess;

              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Material(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(12),
                  child: InkWell(
                    onTap: locked
                        ? () => context.push('/pricing')
                        : () => context.push('/part/$partNum?tab=quiz'),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: rowPassed
                              ? AppColors.success.withValues(alpha: 0.3)
                              : AppColors.border,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 40, height: 40,
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: Text('$partNum',
                                style: TextStyle(color: color, fontSize: 14, fontWeight: FontWeight.w800)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(part.title,
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 14, fontWeight: FontWeight.w600),
                                  maxLines: 1, overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(part.subtitle,
                                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                                  maxLines: 1, overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          if (locked)
                            const Icon(Icons.lock_outline_rounded,
                                color: AppColors.textMuted, size: 18)
                          else
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text('$score%',
                                    style: TextStyle(
                                      color: rowPassed ? AppColors.success : AppColors.error,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(rowPassed ? 'Passed' : 'Try again',
                                    style: TextStyle(
                                      color: rowPassed
                                          ? AppColors.success.withValues(alpha: 0.7)
                                          : AppColors.textMuted,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value;
  final String label;
  final Color color;

  const _StatCard({
    required this.value,
    required this.label,
    this.color = AppColors.textPrimary,
  });

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
            Text(value,
              style: TextStyle(
                color: color,
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(label,
              style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }
}
