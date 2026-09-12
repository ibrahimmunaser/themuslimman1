import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/iap_provider.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/system_insets.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../l10n/app_strings.dart';

class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  bool _restoring = false;

  void _onIAP(IAPState? prev, IAPState next) {
    // Bug fix: this handler never checked for IAPStatus.success, so a
    // successful restore left `_restoring` (and its spinner) stuck forever
    // — the user had no way to know the restore worked or to proceed.
    if (next.status == IAPStatus.success && prev?.status != IAPStatus.success) {
      if (mounted) setState(() => _restoring = false);
      ref.read(iapProvider.notifier).clearSuccess();
      if (!mounted) return;
      // Guests must create an account after purchase so access syncs across
      // Android, iOS, and web — mirrors landing/pricing screens.
      if (ref.read(authProvider).isAnonymous) {
        context.go('/signup');
      } else {
        _snack(t(ref.read(courseLangProvider), 'welcomeRestoreSuccess'));
        context.go('/dashboard');
      }
      return;
    }
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
      _snack(t(ref.read(courseLangProvider), 'welcomeRestoreNone'));
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

  Future<void> _restore() async {
    HapticFeedback.lightImpact();
    // Restore without forcing login (Apple Guideline 5.1.1(v)) — silently
    // provision a guest session if needed, then restore StoreKit purchases.
    setState(() => _restoring = true);
    final ready = await ref.read(authProvider.notifier).ensureSession();
    if (!mounted) return;
    if (!ready || !ref.read(authProvider).isLoggedIn) {
      setState(() => _restoring = false);
      _snack(ref.read(authProvider).error ??
          t(ref.read(courseLangProvider), 'welcomeRestoreError'));
      return;
    }
    await ref.read(iapProvider.notifier).restorePurchases();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<IAPState>(iapProvider, _onIAP);
    final iap = ref.watch(iapProvider);
    final lang = ref.watch(courseLangProvider);
    final busy = _restoring ||
        iap.status == IAPStatus.purchasing ||
        iap.status == IAPStatus.verifying;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: AppGradientBackground(
        child: SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Top bar ───────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 8, 0),
                child: Row(
                  children: [
                    Flexible(
                      child: Text(
                        t(lang, 'welcomeTitleLine1'),
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const AppLangToggle(),
                    const SizedBox(width: 4),
                    // Returning learners only — purchase path is the primary CTAs
                    // below (Start Part 1 Free / Start Full Course), not Sign In.
                    TextButton(
                      onPressed: () {
                        HapticFeedback.selectionClick();
                        context.push('/login');
                      },
                      child: Text(
                        t(lang, 'welcomeReturning'),
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 400.ms),

              // ── Scrollable body ───────────────────────────────────────────
              Expanded(
                child: SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(24, 16, 24, 24 + bottomSystemInset(context)),
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
                          child: Text(
                            t(lang, 'welcomeCourseHeadline'),
                            style: const TextStyle(
                              color: AppColors.gold,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.2, end: 0),
                      ),

                      const SizedBox(height: 18),

                      Text(
                        t(lang, 'welcomeTagline'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          height: 1.25,
                          letterSpacing: -0.5,
                        ),
                      ).animate(delay: 80.ms).fadeIn(duration: 500.ms).slideY(begin: 0.15, end: 0),

                      const SizedBox(height: 12),

                      Text(
                        t(lang, 'welcomeSubtext'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 14,
                          height: 1.55,
                        ),
                      ).animate(delay: 130.ms).fadeIn(duration: 500.ms),

                      const SizedBox(height: 28),

                      // ── Feature highlights ────────────────────────────────
                      Column(
                        children: [
                          _FeatureRow(
                            icon: Icons.play_circle_outline_rounded,
                            color: const Color(0xFF5A90B0),
                            label: t(lang, 'featureWatchListenRead'),
                            detail: t(lang, 'featureWatchListenReadDetail'),
                          ),
                          const SizedBox(height: 10),
                          _FeatureRow(
                            icon: Icons.style_outlined,
                            color: const Color(0xFF6AAE50),
                            label: t(lang, 'featurePracticeReview'),
                            detail: t(lang, 'featurePracticeReviewDetail'),
                          ),
                          const SizedBox(height: 10),
                          _FeatureRow(
                            icon: Icons.insights_outlined,
                            color: const Color(0xFFB08040),
                            label: t(lang, 'featureTrackProgress'),
                            detail: t(lang, 'featureTrackProgressDetail'),
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
                        child: Text(
                          t(lang, 'welcomeStartFree'),
                          style: const TextStyle(
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
                        child: Text(
                          t(lang, 'welcomeStartFull'),
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                      ).animate(delay: 260.ms).fadeIn(duration: 400.ms),

                      const SizedBox(height: 16),

                      Center(
                        child: TextButton(
                          onPressed: () {
                            HapticFeedback.selectionClick();
                            context.push('/login');
                          },
                          style: TextButton.styleFrom(
                            minimumSize: const Size(48, 44),
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                          ),
                          child: Text(
                            t(lang, 'welcomeAlreadyAccess'),
                            style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                          ),
                        ),
                      ).animate(delay: 280.ms).fadeIn(duration: 400.ms),

                      const SizedBox(height: 8),

                      Center(
                        child: iap.status == IAPStatus.verifying
                            // Restoring a genuine purchase re-verifies against
                            // the same slow backend call as a fresh buy — see
                            // VerifyingPurchaseBanner doc comment.
                            ? const VerifyingPurchaseBanner()
                            : busy
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator.adaptive(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                          AppColors.gold),
                                    ),
                                  )
                                : TextButton(
                                    onPressed: _restore,
                                    style: TextButton.styleFrom(
                                        foregroundColor: AppColors.textMuted),
                                    child: Text(
                                      t(lang, 'welcomeRestore'),
                                      style: const TextStyle(fontSize: 12),
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
