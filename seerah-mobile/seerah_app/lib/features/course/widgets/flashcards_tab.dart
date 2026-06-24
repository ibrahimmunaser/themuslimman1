import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/part_model.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/theme/app_colors.dart';
import 'package:shimmer/shimmer.dart';

class FlashcardsTab extends ConsumerStatefulWidget {
  final int partNumber;
  const FlashcardsTab({super.key, required this.partNumber});

  @override
  ConsumerState<FlashcardsTab> createState() => _FlashcardsTabState();
}

class _FlashcardsTabState extends ConsumerState<FlashcardsTab> {
  int _currentIndex = 0;
  bool _showingAnswer = false;

  void _flip() => setState(() => _showingAnswer = !_showingAnswer);

  void _next(List<FlashcardModel> cards) {
    if (_currentIndex < cards.length - 1) {
      setState(() { _currentIndex++; _showingAnswer = false; });
    }
  }

  void _prev(List<FlashcardModel> cards) {
    if (_currentIndex > 0) {
      setState(() { _currentIndex--; _showingAnswer = false; });
    }
  }

  void _reset() => setState(() { _currentIndex = 0; _showingAnswer = false; });

  @override
  Widget build(BuildContext context) {
    final cardsAsync = ref.watch(flashcardsProvider(widget.partNumber));

    return cardsAsync.when(
      loading: () => _LoadingCards(),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.style_outlined, size: 48, color: AppColors.textMuted),
            const SizedBox(height: 12),
            const Text('Flashcards unavailable', style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => ref.invalidate(flashcardsProvider(widget.partNumber)),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
      data: (cards) {
        if (cards.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.style_outlined, size: 48, color: AppColors.textMuted),
                SizedBox(height: 12),
                Text('No flashcards for this part', style: TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          );
        }

        final isLast = _currentIndex == cards.length - 1;

        return Column(
          children: [
            // Progress bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
              child: Row(
                children: [
                  Text(
                    '${_currentIndex + 1} / ${cards.length}',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(2),
                      child: LinearProgressIndicator(
                        value: (_currentIndex + 1) / cards.length,
                        backgroundColor: AppColors.border,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppColors.gold),
                        minHeight: 4,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  IconButton(
                    onPressed: _reset,
                    icon: const Icon(Icons.refresh, size: 18, color: AppColors.textMuted),
                    tooltip: 'Restart',
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),

            // Card
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: GestureDetector(
                  onTap: _flip,
                  child: _FlipCard(
                    question: cards[_currentIndex].question,
                    answer: cards[_currentIndex].answer,
                    showAnswer: _showingAnswer,
                  ),
                ),
              ),
            ),

            // Controls
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _NavButton(
                    icon: Icons.arrow_back,
                    label: 'Prev',
                    onPressed: _currentIndex > 0 ? () => _prev(cards) : null,
                  ),
                  _FlipButton(onTap: _flip, showing: _showingAnswer),
                  _NavButton(
                    icon: Icons.arrow_forward,
                    label: isLast ? 'Done' : 'Next',
                    onPressed: () => isLast ? _reset() : _next(cards),
                    primary: isLast,
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _FlipCard extends StatefulWidget {
  final String question;
  final String answer;
  final bool showAnswer;

  const _FlipCard({required this.question, required this.answer, required this.showAnswer});

  @override
  State<_FlipCard> createState() => _FlipCardState();
}

class _FlipCardState extends State<_FlipCard> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(duration: const Duration(milliseconds: 350), vsync: this);
    _anim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void didUpdateWidget(_FlipCard old) {
    super.didUpdateWidget(old);
    if (widget.showAnswer != old.showAnswer) {
      widget.showAnswer ? _ctrl.forward() : _ctrl.reverse();
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (ctx, _) {
        final showFront = _anim.value <= 0.5;
        // Single 0→π sweep: front rotates away, back counter-rotates by π to face forward
        final angle = _anim.value * math.pi;

        return Transform(
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.001)
            ..rotateY(angle),
          alignment: Alignment.center,
          child: showFront
              ? _CardFace(text: widget.question, isQuestion: true)
              : Transform(
                  transform: Matrix4.identity()..rotateY(math.pi),
                  alignment: Alignment.center,
                  child: _CardFace(text: widget.answer, isQuestion: false),
                ),
        );
      },
    );
  }
}

class _CardFace extends StatelessWidget {
  final String text;
  final bool isQuestion;
  const _CardFace({required this.text, required this.isQuestion});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: isQuestion ? AppColors.card : AppColors.goldFaded,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isQuestion ? AppColors.border : AppColors.gold.withValues(alpha: 0.5),
          width: isQuestion ? 1 : 1.5,
        ),
      ),
      child: LayoutBuilder(
        builder: (ctx, constraints) => SingleChildScrollView(
          padding: const EdgeInsets.all(0),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  isQuestion ? 'QUESTION' : 'ANSWER',
                  style: TextStyle(
                    color: isQuestion ? AppColors.textMuted : AppColors.gold,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  text,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                Text(
                  isQuestion ? 'Tap to reveal answer' : '',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onPressed;
  final bool primary;

  const _NavButton({
    required this.icon,
    required this.label,
    this.onPressed,
    this.primary = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: primary ? AppColors.gold : AppColors.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: primary ? AppColors.gold : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: primary ? Colors.black : (onPressed != null ? AppColors.textPrimary : AppColors.textMuted)),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(
              color: primary ? Colors.black : (onPressed != null ? AppColors.textPrimary : AppColors.textMuted),
              fontSize: 14, fontWeight: FontWeight.w500,
            )),
          ],
        ),
      ),
    );
  }
}

class _FlipButton extends StatelessWidget {
  final VoidCallback onTap;
  final bool showing;
  const _FlipButton({required this.onTap, required this.showing});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppColors.goldFaded,
          border: Border.all(color: AppColors.gold.withValues(alpha: 0.5)),
        ),
        child: Icon(
          showing ? Icons.visibility_off_outlined : Icons.flip,
          color: AppColors.gold,
          size: 22,
        ),
      ),
    );
  }
}

class _LoadingCards extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.card,
      highlightColor: AppColors.surface,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 40),
            Container(
              height: 300,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
