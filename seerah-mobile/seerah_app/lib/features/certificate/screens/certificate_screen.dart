import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';

const _kRequiredParts = 100;
const _kRequiredQuizPct = 70;

class CertificateScreen extends ConsumerWidget {
  const CertificateScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final progressAsync = ref.watch(progressProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: const Text('Certificate'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
      ),
      body: progressAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.gold)),
        error: (_, __) => const Center(
          child: Text('Failed to load progress', style: TextStyle(color: AppColors.textSecondary)),
        ),
        data: (progress) {
          final studied = progress.totalViewed;
          final quizzesPassed = progress.totalCompleted;
          final quizPct = _kRequiredParts == 0
              ? 0.0
              : (quizzesPassed / _kRequiredParts * 100);

          final meetsStudied = studied >= _kRequiredParts;
          final meetsQuiz = quizPct >= _kRequiredQuizPct;
          final isEarned = meetsStudied && meetsQuiz;

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
            children: [
              // Certificate card
              Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: isEarned
                        ? [
                            AppColors.gold.withValues(alpha: 0.18),
                            AppColors.goldDark.withValues(alpha: 0.06),
                          ]
                        : [AppColors.card, AppColors.surface],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isEarned
                        ? AppColors.gold.withValues(alpha: 0.5)
                        : AppColors.border,
                    width: isEarned ? 1.5 : 1,
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 80, height: 80,
                      decoration: BoxDecoration(
                        color: isEarned
                            ? AppColors.gold.withValues(alpha: 0.15)
                            : AppColors.border.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isEarned
                              ? AppColors.gold.withValues(alpha: 0.4)
                              : AppColors.border,
                          width: 2,
                        ),
                      ),
                      child: Icon(
                        isEarned ? Icons.workspace_premium_rounded : Icons.lock_outline_rounded,
                        color: isEarned ? AppColors.gold : AppColors.textMuted,
                        size: 38,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      isEarned ? 'Certificate of Completion' : 'Certificate Locked',
                      style: TextStyle(
                        color: isEarned ? AppColors.gold : AppColors.textSecondary,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.2,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'The Complete Seerah of the Prophet ﷺ',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                        height: 1.4,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    if (isEarned) ...[
                      const SizedBox(height: 16),
                      const Divider(color: AppColors.border),
                      const SizedBox(height: 16),
                      Text(
                        auth.user?.name ?? 'Student',
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'has successfully completed all 100 parts\nof the Seerah of the Prophet Muhammad ﷺ',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // Requirements
              const Text(
                'Requirements',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),

              _RequirementRow(
                icon: Icons.play_lesson_rounded,
                label: 'Study all 100 parts',
                current: studied,
                required: _kRequiredParts,
                met: meetsStudied,
              ),
              const SizedBox(height: 10),
              _RequirementRow(
                icon: Icons.quiz_rounded,
                label: 'Pass 70%+ of quizzes',
                current: quizzesPassed,
                required: (_kRequiredParts * _kRequiredQuizPct / 100).ceil(),
                met: meetsQuiz,
                suffix: '(${quizPct.round()}%)',
              ),

              if (!isEarned) ...[
                const SizedBox(height: 28),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline_rounded, color: AppColors.textMuted, size: 20),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Keep studying and passing quizzes. Your certificate will unlock automatically when you meet all requirements.',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.go('/course'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: const Text('Continue Learning',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _RequirementRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final int current;
  final int required;
  final bool met;
  final String? suffix;

  const _RequirementRow({
    required this.icon,
    required this.label,
    required this.current,
    required this.required,
    required this.met,
    this.suffix,
  });

  @override
  Widget build(BuildContext context) {
    final fraction = (current / required).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: met ? AppColors.success.withValues(alpha: 0.3) : AppColors.border,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(icon, color: met ? AppColors.success : AppColors.textMuted, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text(label,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w500)),
              ),
              if (met)
                const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 18)
              else
                Text('$current / $required${suffix != null ? " $suffix" : ""}',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: fraction,
              backgroundColor: AppColors.border,
              valueColor: AlwaysStoppedAnimation<Color>(
                met ? AppColors.success : AppColors.gold,
              ),
              minHeight: 5,
            ),
          ),
        ],
      ),
    );
  }
}
