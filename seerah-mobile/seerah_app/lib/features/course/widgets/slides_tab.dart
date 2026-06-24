import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/theme/app_colors.dart';

class SlidesTab extends ConsumerStatefulWidget {
  final int partNumber;
  /// 0 = presented (infographic), 1 = detailed, 2 = facts
  final int initialDeck;
  const SlidesTab({super.key, required this.partNumber, this.initialDeck = 1});

  @override
  ConsumerState<SlidesTab> createState() => _SlidesTabState();
}

class _SlidesTabState extends ConsumerState<SlidesTab> {
  // 0 = presented, 1 = detailed, 2 = facts
  late int _deckIndex = widget.initialDeck;
  int _slideIndex = 0;
  late final PageController _pageCtrl;

  @override
  void initState() {
    super.initState();
    _pageCtrl = PageController();
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final slidesAsync = ref.watch(slidesProvider(widget.partNumber));

    return slidesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.gold)),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.slideshow_outlined, size: 48, color: AppColors.textMuted),
            const SizedBox(height: 12),
            const Text('Slides unavailable', style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () => ref.invalidate(slidesProvider(widget.partNumber)),
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
      data: (slides) {
        final decks = [
          ('Presented', slides.presented),
          ('Detailed', slides.detailed),
          ('Key Facts', slides.facts),
        ];

        final activeDeck = decks[_deckIndex].$2;

        if (activeDeck.isEmpty) {
          // Try another deck
          final nonEmpty = decks.indexWhere((d) => d.$2.isNotEmpty);
          if (nonEmpty >= 0 && nonEmpty != _deckIndex) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) setState(() { _deckIndex = nonEmpty; _slideIndex = 0; });
            });
          }
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.slideshow_outlined, size: 48, color: AppColors.textMuted),
                SizedBox(height: 12),
                Text('No slides for this deck', style: TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          );
        }

        final canPrev = _slideIndex > 0;
        final canNext = _slideIndex < activeDeck.length - 1;

        return Column(
          children: [
            // ── Segmented deck selector ──────────────────────────────────────
            Container(
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: decks.asMap().entries.map((e) {
                  final selected = e.key == _deckIndex;
                  final hasSlides = e.value.$2.isNotEmpty;
                  return Expanded(
                    child: GestureDetector(
                      onTap: hasSlides ? () {
                        setState(() { _deckIndex = e.key; _slideIndex = 0; });
                        _pageCtrl.jumpToPage(0);
                      } : null,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        curve: Curves.easeInOut,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: selected ? AppColors.gold : Colors.transparent,
                          borderRadius: BorderRadius.circular(9),
                          boxShadow: selected ? [
                            BoxShadow(
                              color: AppColors.gold.withValues(alpha: 0.25),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ] : null,
                        ),
                        child: Text(
                          e.value.$1,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: !hasSlides
                                ? AppColors.textMuted
                                : selected
                                ? Colors.black
                                : AppColors.textSecondary,
                            fontSize: 13,
                            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                            letterSpacing: selected ? -0.2 : 0,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            // ── Progress bar ─────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 2),
              child: Row(
                children: [
                  Text(
                    '${_slideIndex + 1} / ${activeDeck.length}',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(2),
                      child: LinearProgressIndicator(
                        value: (_slideIndex + 1) / activeDeck.length,
                        backgroundColor: AppColors.border,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppColors.gold),
                        minHeight: 3,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── Slide viewer ─────────────────────────────────────────────────
            Expanded(
              child: PageView.builder(
                controller: _pageCtrl,
                itemCount: activeDeck.length,
                onPageChanged: (i) => setState(() => _slideIndex = i),
                itemBuilder: (ctx, i) {
                  final slide = activeDeck[i];
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: CachedNetworkImage(
                        imageUrl: slide.medium,
                        fit: BoxFit.contain,
                        placeholder: (ctx, url) => Container(
                          color: AppColors.card,
                          child: const Center(
                            child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 2),
                          ),
                        ),
                        errorWidget: (ctx, url, err) => Container(
                          color: AppColors.card,
                          child: const Center(
                            child: Icon(Icons.broken_image_outlined, color: AppColors.textMuted, size: 32),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // ── Prev / Next buttons ───────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 6, 16, 16),
              child: Row(
                children: [
                  _NavBtn(
                    icon: Icons.arrow_back_ios_rounded,
                    label: 'Prev',
                    enabled: canPrev,
                    onTap: canPrev
                        ? () => _pageCtrl.previousPage(
                            duration: const Duration(milliseconds: 250),
                            curve: Curves.easeOut)
                        : null,
                  ),
                  Expanded(
                    child: Center(
                      child: Text(
                        'Swipe to navigate',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                      ),
                    ),
                  ),
                  _NavBtn(
                    icon: Icons.arrow_forward_ios_rounded,
                    label: 'Next',
                    enabled: canNext,
                    trailingIcon: true,
                    onTap: canNext
                        ? () => _pageCtrl.nextPage(
                            duration: const Duration(milliseconds: 250),
                            curve: Curves.easeOut)
                        : null,
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

class _NavBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool enabled;
  final bool trailingIcon;
  final VoidCallback? onTap;

  const _NavBtn({
    required this.icon,
    required this.label,
    required this.enabled,
    this.trailingIcon = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = enabled ? AppColors.textPrimary : AppColors.textMuted;
    final bgColor = enabled ? AppColors.card : AppColors.surface;
    final borderColor = enabled ? AppColors.border : AppColors.border.withValues(alpha: 0.4);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: trailingIcon
              ? [
                  Text(label, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w500)),
                  const SizedBox(width: 6),
                  Icon(icon, size: 14, color: color),
                ]
              : [
                  Icon(icon, size: 14, color: color),
                  const SizedBox(width: 6),
                  Text(label, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w500)),
                ],
        ),
      ),
    );
  }
}
