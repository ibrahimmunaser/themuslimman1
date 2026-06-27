import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/iap_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_kit.dart';

class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  bool _restoring = false;

  void _onIAP(IAPState? prev, IAPState next) {
    if (next.status == IAPStatus.error &&
        next.errorMessage != null &&
        prev?.errorMessage != next.errorMessage) {
      if (mounted) setState(() => _restoring = false);
      _snack(next.errorMessage!);
      ref.read(iapProvider.notifier).clearError();
      return;
    }
    if (next.status == IAPStatus.restoreEmpty &&
        prev?.status != IAPStatus.restoreEmpty) {
      if (mounted) setState(() => _restoring = false);
      _snack('No previous purchases found.');
      return;
    }
    if (next.status == IAPStatus.idle && prev?.status == IAPStatus.verifying) {
      if (mounted) setState(() => _restoring = false);
    }
  }

  void _snack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating),
    );
  }

  void _restore() {
    HapticFeedback.lightImpact();
    // Restore requires an authenticated account.
    final isLoggedIn = ref.read(authProvider).isLoggedIn;
    if (!isLoggedIn) {
      context.push('/login');
      return;
    }
    setState(() => _restoring = true);
    ref.read(iapProvider.notifier).restorePurchases();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<IAPState>(iapProvider, _onIAP);
    final iap = ref.watch(iapProvider);
    final busy = _restoring ||
        iap.status == IAPStatus.purchasing ||
        iap.status == IAPStatus.verifying;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: AppGradientBackground(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Top bar ───────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 8, 0),
                child: Row(
                  children: [
                    const Text(
                      'Complete Seerah',
                      style: TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.2,
                      ),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () {
                        HapticFeedback.selectionClick();
                        context.push('/login');
                      },
                      child: const Text(
                        'Sign In',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 400.ms),

              // ── Scrollable body ───────────────────────────────────────────
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [

                      // ── Hero ──────────────────────────────────────────────
                      Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.goldFaded,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
                          ),
                          child: const Text(
                            '100-Part Seerah Course',
                            style: TextStyle(
                              color: AppColors.gold,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.2, end: 0),
                      ),

                      const SizedBox(height: 18),

                      const Text(
                        'Learn the life of the\nProphet Muhammad ﷺ\nin 100 structured parts',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          height: 1.25,
                          letterSpacing: -0.5,
                        ),
                      ).animate(delay: 80.ms).fadeIn(duration: 500.ms).slideY(begin: 0.15, end: 0),

                      const SizedBox(height: 12),

                      const Text(
                        'Video lessons, quizzes, flashcards, and progress tracking — built to help you learn step by step.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 14,
                          height: 1.55,
                        ),
                      ).animate(delay: 130.ms).fadeIn(duration: 500.ms),

                      const SizedBox(height: 28),

                      // ── Feature highlights ────────────────────────────────
                      Column(
                        children: const [
                          _FeatureRow(
                            icon: Icons.play_circle_outline_rounded,
                            color: Color(0xFF5A90B0),
                            label: 'Watch, listen, or read',
                            detail: 'Video · Audio · Reading',
                          ),
                          SizedBox(height: 10),
                          _FeatureRow(
                            icon: Icons.style_outlined,
                            color: Color(0xFF6AAE50),
                            label: 'Practice and review',
                            detail: 'Flashcards · Quizzes · Slides',
                          ),
                          SizedBox(height: 10),
                          _FeatureRow(
                            icon: Icons.insights_outlined,
                            color: Color(0xFFB08040),
                            label: 'Track your progress',
                            detail: 'Pick up where you left off',
                          ),
                        ],
                      ).animate(delay: 180.ms).fadeIn(duration: 500.ms),

                      const SizedBox(height: 32),

                      // ── CTAs ──────────────────────────────────────────────
                      ElevatedButton(
                        onPressed: () {
                          HapticFeedback.mediumImpact();
                          context.push('/part/1');
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 17),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          elevation: 0,
                          shadowColor: Colors.transparent,
                        ),
                        child: const Text(
                          'Start Part 1 Free',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.1,
                          ),
                        ),
                      ).animate(delay: 240.ms).fadeIn(duration: 400.ms).slideY(begin: 0.2, end: 0),

                      const SizedBox(height: 10),

                      OutlinedButton(
                        onPressed: () {
                          HapticFeedback.selectionClick();
                          context.push('/landing');
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.gold,
                          side: BorderSide(color: AppColors.gold.withValues(alpha: 0.40)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: const Text(
                          'Start Full Course',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                      ).animate(delay: 260.ms).fadeIn(duration: 400.ms),

                      const SizedBox(height: 16),

                      Center(
                        child: GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            context.push('/login');
                          },
                          child: RichText(
                            text: const TextSpan(
                              style: TextStyle(fontSize: 13, color: AppColors.textMuted),
                              children: [
                                TextSpan(text: 'Already have access? '),
                                TextSpan(
                                  text: 'Sign in',
                                  style: TextStyle(
                                    color: AppColors.gold,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ).animate(delay: 280.ms).fadeIn(duration: 400.ms),

                      const SizedBox(height: 8),

                      Center(
                        child: busy
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.gold,
                                ),
                              )
                            : TextButton(
                                onPressed: _restore,
                                style: TextButton.styleFrom(
                                    foregroundColor: AppColors.textMuted),
                                child: const Text(
                                  'Restore purchase',
                                  style: TextStyle(fontSize: 12),
                                ),
                              ),
                      ).animate(delay: 320.ms).fadeIn(duration: 400.ms),

                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Feature highlight row ─────────────────────────────────────────────────────

class _FeatureRow extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final String detail;

  const _FeatureRow({
    required this.icon,
    required this.color,
    required this.label,
    required this.detail,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: color.withValues(alpha: 0.22)),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  detail,
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11.5,
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.check_circle_rounded,
              size: 16, color: color.withValues(alpha: 0.7)),
        ],
      ),
    );
  }
}
