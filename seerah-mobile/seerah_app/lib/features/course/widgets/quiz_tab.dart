import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/part_model.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';

class QuizTab extends ConsumerStatefulWidget {
  final int partNumber;
  const QuizTab({super.key, required this.partNumber});

  @override
  ConsumerState<QuizTab> createState() => _QuizTabState();
}

class _QuizTabState extends ConsumerState<QuizTab> {
  int _currentQ = 0;
  int? _selected;
  bool _submitted = false;
  int _score = 0;
  bool _done = false;
  List<int?> _answers = [];
  // questionId -> chosen option TEXT (not index) — sent to the server so it
  // can independently recompute the score from the authoritative
  // correct_answer values instead of trusting a client-supplied percentage,
  // which would otherwise be trivially forgeable via a raw HTTP POST.
  final Map<String, String> _answerTexts = {};
  // Re-entrancy guard for _submit/_next: without it, two taps landing in
  // the same synchronous event (fast double-tap, a stuck screen-protector,
  // an assistive-technology repeat) could both fire before setState's
  // rebuild flips _submitted/_currentQ, double-incrementing _score /
  // double-pushing into _answers (pushing the percentage past 100%) or
  // double-firing the final-question branch (double-recording the quiz
  // score server-side).
  bool _busy = false;

  void _select(int i) {
    if (!_submitted) setState(() => _selected = i);
  }

  void _submit(List<QuizQuestion> questions) {
    if (_selected == null || _submitted || _busy) return;
    _busy = true;
    final q = questions[_currentQ];
    setState(() {
      _submitted = true;
      _answers.add(_selected);
      if (_selected! >= 0 && _selected! < q.options.length) {
        _answerTexts[q.id] = q.options[_selected!];
      }
      if (_selected == q.correctIndex) _score++;
    });
    // setState() mutates synchronously and returns immediately — clearing
    // _busy here (in the same call stack) would NOT actually block a second
    // tap event dispatched in the same frame (e.g. a duplicate/ghost touch),
    // since _submitted/_busy would already both read as "safe to resubmit"
    // before Flutter has even rebuilt. Deferring the reset to the next frame
    // makes the guard actually block same-frame re-entrancy.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _busy = false;
    });
  }

  void _next(List<QuizQuestion> questions) {
    if (_busy) return;
    _busy = true;
    if (_currentQ < questions.length - 1) {
      setState(() { _currentQ++; _selected = null; _submitted = false; });
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _busy = false;
      });
    } else {
      // Save score before showing results screen. The percentage here is
      // only used for the immediate local UI/optimistic cache — the server
      // independently recomputes the authoritative score from _answerTexts.
      final pct = questions.isEmpty
          ? 0
          : (_score / questions.length * 100).round();
      ref.read(progressProvider.notifier).recordQuizScore(
            widget.partNumber,
            pct,
            answers: Map.of(_answerTexts),
          );
      setState(() { _done = true; _busy = false; });
    }
  }

  void _restart() {
    if (_busy) return;
    setState(() {
      _currentQ = 0;
      _selected = null;
      _submitted = false;
      _score = 0;
      _done = false;
      _answers = [];
      _answerTexts.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final quizAsync = ref.watch(quizProvider(widget.partNumber));

    return quizAsync.when(
      loading: () => const Center(
        child: CircularProgressIndicator.adaptive(
          valueColor: AlwaysStoppedAnimation(AppColors.gold),
        ),
      ),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.quiz_outlined, size: 48, color: AppColors.textMuted),
            const SizedBox(height: 12),
            const Text('Quiz unavailable', style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => ref.invalidate(quizProvider(widget.partNumber)),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
      data: (questions) {
        if (questions.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.quiz_outlined, size: 48, color: AppColors.textMuted),
                SizedBox(height: 12),
                Text('No quiz for this part yet', style: TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          );
        }

        if (_done) {
          return _ResultsScreen(
          score: _score,
          total: questions.length,
          onRestart: _restart,
        );
        }

        final q = questions[_currentQ];
        return Column(
          children: [
            // Progress
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  Text(
                    'Question ${_currentQ + 1} of ${questions.length}',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                  const Spacer(),
                  Text(
                    'Score: $_score',
                    style: const TextStyle(color: AppColors.gold, fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: LinearProgressIndicator(
                  value: (_currentQ + 1) / questions.length,
                  backgroundColor: AppColors.border,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.gold),
                  minHeight: 4,
                ),
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    // Question
                    Text(
                      q.question,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        height: 1.45,
                      ),
                    ).animate().fadeIn(duration: 300.ms),

                    const SizedBox(height: 24),

                    // Options
                    ...q.options.asMap().entries.map((entry) {
                      final i = entry.key;
                      final opt = entry.value;
                      final isCorrect = i == q.correctIndex;
                      final isSelected = i == _selected;

                      Color borderColor = AppColors.border;
                      Color bgColor = AppColors.card;
                      Color textColor = AppColors.textPrimary;

                      if (_submitted) {
                        if (isCorrect) {
                          borderColor = AppColors.success;
                          bgColor = AppColors.success.withValues(alpha: 0.1);
                          textColor = AppColors.success;
                        } else if (isSelected) {
                          borderColor = AppColors.error;
                          bgColor = AppColors.error.withValues(alpha: 0.1);
                          textColor = AppColors.error;
                        }
                      } else if (isSelected) {
                        borderColor = AppColors.gold;
                        bgColor = AppColors.goldFaded;
                      }

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          decoration: BoxDecoration(
                            color: bgColor,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderColor, width: isSelected || (_submitted && isCorrect) ? 1.5 : 1),
                          ),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: () => _select(i),
                              borderRadius: BorderRadius.circular(12),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Row(
                              children: [
                                Container(
                                  width: 28, height: 28,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: (_submitted && isCorrect) ? AppColors.success.withValues(alpha: 0.2)
                                        : (_submitted && isSelected) ? AppColors.error.withValues(alpha: 0.2)
                                        : isSelected ? AppColors.goldFaded
                                        : AppColors.surface,
                                    border: Border.all(color: borderColor),
                                  ),
                                  child: _submitted
                                      ? Icon(
                                          isCorrect ? Icons.check : (isSelected ? Icons.close : null),
                                          size: 14,
                                          color: isCorrect ? AppColors.success : AppColors.error,
                                        )
                                      : null,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(opt, style: TextStyle(
                                    color: textColor, fontSize: 15, height: 1.4,
                                    fontWeight: isSelected || (_submitted && isCorrect) ? FontWeight.w500 : FontWeight.normal,
                                  )),
                                ),
                              ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ).animate(delay: (i * 50).ms).fadeIn(duration: 250.ms).slideX(begin: 0.05, end: 0);
                    }),

                    // Explanation
                    if (_submitted && q.explanation != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.goldFaded,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.lightbulb_outline, color: AppColors.gold, size: 18),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(q.explanation!,
                                style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, height: 1.5)),
                            ),
                          ],
                        ),
                      ).animate().fadeIn(duration: 300.ms),
                    ],
                  ],
                ),
              ),
            ),

            // Submit / Next
            Padding(
              // Audit M4 fix: this used to ALSO add bottomSystemInset(context)
              // on top of a 16 floor — but QuizTab's only host,
              // _AssetViewerScreen (part_screen.dart), already wraps its
              // child in `Padding(bottom: bottomSystemInset(context))`, so
              // the system nav bar/gesture inset was being applied twice,
              // pushing this button up by roughly double the real inset on
              // Android. Plain 16 here is purely visual breathing room below
              // the button — the actual system-bar clearance is the outer
              // AssetViewerScreen's job.
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: SizedBox(
                width: double.infinity,
                child: _submitted
                    ? ElevatedButton(
                        onPressed: () => _next(questions),
                        child: Text(_currentQ < questions.length - 1 ? 'Next Question' : 'See Results'),
                      )
                    : ElevatedButton(
                        onPressed: _selected != null ? () => _submit(questions) : null,
                        child: const Text('Submit Answer'),
                      ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _ResultsScreen extends StatelessWidget {
  final int score;
  final int total;
  final VoidCallback onRestart;

  const _ResultsScreen({required this.score, required this.total, required this.onRestart});

  @override
  Widget build(BuildContext context) {
    final pct = (score / total * 100).round();
    final passed = pct >= 80;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(32),
      child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100, height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: (passed ? AppColors.success : AppColors.error).withValues(alpha: 0.1),
                border: Border.all(
                  color: passed ? AppColors.success : AppColors.error, width: 2,
                ),
              ),
              child: Center(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text('$pct%', style: TextStyle(
                    color: passed ? AppColors.success : AppColors.error,
                    fontSize: 28, fontWeight: FontWeight.w800,
                  )),
                ),
              ),
            ).animate().scale(duration: 400.ms, curve: Curves.elasticOut),

            const SizedBox(height: 24),
            Text(
              passed ? 'Well done!' : 'Keep going!',
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 24, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              '$score out of $total correct',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              passed ? 'You passed with $pct%' : 'Need 80% to pass — try again!',
              style: TextStyle(
                color: passed ? AppColors.success : AppColors.textMuted,
                fontSize: 13,
              ),
            ),

            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onRestart,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Try Again'),
              ),
            ),
          ],
        ),
    );
  }
}
