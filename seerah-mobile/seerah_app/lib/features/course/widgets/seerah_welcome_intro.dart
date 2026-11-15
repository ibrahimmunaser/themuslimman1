import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_strings.dart';

/// The marketing "Complete Seerah" intro (hero badge, tagline, feature
/// highlights, and the two main CTAs), shown inline at the top of
/// [SeerahHubScreen] for a signed-out/guest visitor — the same content that
/// used to live exclusively on the old full-screen WelcomeScreen, which
/// auto-blocked the bottom tabs on every fresh install. Kept deliberately
/// free of WelcomeScreen's own top bar and Restore-purchase flow (those
/// already live elsewhere — this screen's own AppBar, and Account/Profile)
/// so nothing is duplicated.
class SeerahWelcomeIntro extends ConsumerWidget {
  const SeerahWelcomeIntro({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(courseLangProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
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
              style: TextStyle(
                color: AppColors.gold,
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.3,
              ),
            ),
          ),
        ),
        const SizedBox(height: 18),
        Text(
          t(lang, 'welcomeTagline'),
          textAlign: TextAlign.center,
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 24,
            fontWeight: FontWeight.w800,
            height: 1.25,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          t(lang, 'welcomeSubtext'),
          textAlign: TextAlign.center,
          style: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 14,
            height: 1.55,
          ),
        ),
        const SizedBox(height: 24),
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
        const SizedBox(height: 22),
        ElevatedButton(
          onPressed: () {
            HapticFeedback.mediumImpact();
            context.push('/part/${AppConstants.kFreePartNumber}');
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
        ),
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
        ),
        const SizedBox(height: 14),
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
              style: TextStyle(fontSize: 13, color: AppColors.textMuted),
            ),
          ),
        ),
        const Divider(height: 28, color: Colors.white12),
      ],
    );
  }
}

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
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  detail,
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11.5,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.check_circle_rounded,
            size: 16,
            color: color.withValues(alpha: 0.7),
          ),
        ],
      ),
    );
  }
}
