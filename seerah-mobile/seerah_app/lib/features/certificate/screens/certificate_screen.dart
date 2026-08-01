import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/profiles_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/system_insets.dart';
import '../../../core/widgets/adaptive_icons.dart';

// Derived from PARTS.length (not hardcoded) so this can never silently
// drift out of sync if a part is ever added/removed.
final _kRequiredParts = PARTS.length;
// This is a coverage requirement ("pass 70 of the 100 per-part quizzes"),
// NOT the per-quiz pass score (that's 80%, see PASS_SCORE in
// mobile-progress/track and progress_provider.dart's recordQuizScore) —
// worded explicitly below to avoid the two being confused.
const _kRequiredQuizPct = 70;

class CertificateScreen extends ConsumerStatefulWidget {
  const CertificateScreen({super.key});

  @override
  ConsumerState<CertificateScreen> createState() => _CertificateScreenState();
}

class _CertificateScreenState extends ConsumerState<CertificateScreen> {
  final _screenshotController = ScreenshotController();
  final _shareButtonKey = GlobalKey();
  bool _sharing = false;

  /// iPad/Mac's share sheet renders as a popover that must be anchored to a
  /// screen rect — without one, share_plus either silently no-ops or throws
  /// depending on platform version. Ignored (harmless) on iPhone.
  Rect? _shareButtonRect() {
    final box =
        _shareButtonKey.currentContext?.findRenderObject() as RenderBox?;
    if (box == null || !box.attached) return null;
    return box.localToGlobal(Offset.zero) & box.size;
  }

  /// Captures just the certificate card (via [_screenshotController]) as a
  /// PNG and hands it to the OS share sheet — previously there was no way at
  /// all to export/save/show off an earned certificate short of a manual
  /// screen-recording, unlike literally any other "certificate of
  /// completion" product.
  Future<void> _shareCertificate() async {
    if (_sharing) return;
    setState(() => _sharing = true);
    try {
      final bytes = await _screenshotController.capture(pixelRatio: 3.0);
      if (bytes == null) throw Exception('Capture returned no data');

      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/seerah_certificate.png');
      await file.writeAsBytes(bytes, flush: true);

      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          text: 'I completed The Complete Seerah of the Prophet ﷺ course! 🎓',
          subject: 'My Seerah Certificate of Completion',
          sharePositionOrigin: _shareButtonRect(),
        ),
      );
    } catch (e) {
      debugPrint('[Certificate] share failed: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not share certificate. Please try again.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final progressAsync = ref.watch(progressProvider);
    // On a family plan, progress/quiz completion is tracked per learner
    // profile — the certificate must bear the name of whichever family
    // member actually earned it, not the account holder who pays for the
    // plan. activeProfile.displayName is always populated and correctly
    // resolves to the account holder's own name for individual plans too
    // (see dashboard_screen.dart for the same reasoning).
    final activeProfile = ref.watch(profilesProvider).valueOrNull?.activeProfile;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: const Text('Certificate'),
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
        error: (_, __) => const Center(
          child: Text(
            'Failed to load progress',
            style: TextStyle(color: AppColors.textSecondary),
          ),
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
            padding: EdgeInsets.fromLTRB(
              20,
              24,
              20,
              40 + bottomSystemInset(context),
            ),
            children: [
              // Certificate card — wrapped in Screenshot so _shareCertificate()
              // can capture exactly this card (not the requirements list
              // below it) as a standalone image to share/export.
              Screenshot(
                controller: _screenshotController,
                child: Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    // Screenshot capture has no ambient Scaffold background
                    // behind it, so an explicit solid color is needed here —
                    // otherwise transparent gradients would export with a
                    // transparent (or platform-dependent black) backdrop.
                    color: AppColors.background,
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
                        width: 80,
                        height: 80,
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
                          isEarned
                              ? Icons.workspace_premium_rounded
                              : Icons.lock_outline_rounded,
                          color: isEarned
                              ? AppColors.gold
                              : AppColors.textMuted,
                          size: 38,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        isEarned
                            ? 'Certificate of Completion'
                            : 'Certificate Locked',
                        style: TextStyle(
                          color: isEarned
                              ? AppColors.gold
                              : AppColors.textSecondary,
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
                          activeProfile?.displayName ?? auth.user?.name ?? 'Student',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'has successfully completed all ${PARTS.length} parts\nof the Seerah of the Prophet Muhammad ﷺ',
                          style: const TextStyle(
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
              ),

              if (isEarned) ...[
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _sharing ? null : _shareCertificate,
                    key: _shareButtonKey,
                    icon: _sharing
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator.adaptive(
                              strokeWidth: 2,
                            ),
                          )
                        : const AdaptiveShareIcon(size: 18),
                    label: Text(_sharing ? 'Preparing…' : 'Share Certificate'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.gold,
                      side: const BorderSide(color: AppColors.gold),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],

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
                label: 'Study all ${PARTS.length} parts',
                current: studied,
                required: _kRequiredParts,
                met: meetsStudied,
              ),
              const SizedBox(height: 10),
              _RequirementRow(
                icon: Icons.quiz_rounded,
                // "Pass 70%+ of quizzes" reads like a per-quiz score
                // threshold, but the real per-quiz pass bar is 80% — this
                // requirement is coverage-based (pass 70+ of the quizzes),
                // so the wording says exactly that to avoid contradicting
                // the 80% pass bar shown when actually taking a quiz.
                label:
                    'Pass the quiz (80%+) for $_kRequiredQuizPct+ of the ${PARTS.length} parts',
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
                      const Icon(
                        Icons.info_outline_rounded,
                        color: AppColors.textMuted,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Keep studying and passing quizzes. Your certificate will unlock automatically when you meet all requirements.',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                            height: 1.4,
                          ),
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
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'Continue Learning',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
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
    final fraction = required == 0 ? 0.0 : (current / required).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: met
              ? AppColors.success.withValues(alpha: 0.3)
              : AppColors.border,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                icon,
                color: met ? AppColors.success : AppColors.textMuted,
                size: 18,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              if (met)
                const Icon(
                  Icons.check_circle_rounded,
                  color: AppColors.success,
                  size: 18,
                )
              else
                Flexible(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      '$current / $required${suffix != null ? " $suffix" : ""}',
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
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
