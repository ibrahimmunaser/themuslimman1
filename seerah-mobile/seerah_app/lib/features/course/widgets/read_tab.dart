import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';

class ReadTab extends ConsumerStatefulWidget {
  final int partNumber;
  /// 0 = Briefing, 1 = Key Facts
  final int initialSection;
  const ReadTab({super.key, required this.partNumber, this.initialSection = 0});

  @override
  ConsumerState<ReadTab> createState() => _ReadTabState();
}

class _ReadTabState extends ConsumerState<ReadTab> {
  late int _activeSection = widget.initialSection.clamp(0, 2);
  final List<String> _sections = ['Briefing', 'Study Guide', 'Key Facts'];
  static const _assetIds = ['briefing', 'study_guide', 'statement-of-facts'];

  final ScrollController _scrollController = ScrollController();
  /// Sections already credited this mount (mirrors web TextViewer 10% gate).
  final Set<int> _trackedSections = {};
  bool _briefingTracked = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    // Key Facts / Study Guide: still require scroll engagement for briefing
    // parity with web — other sections track on first meaningful scroll or
    // when content is short enough that 10% is already visible (post-frame).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _maybeTrackFromScroll();
    });
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() => _maybeTrackFromScroll();

  void _maybeTrackFromScroll() {
    if (!mounted || !_scrollController.hasClients) return;
    final pos = _scrollController.position;
    final max = pos.maxScrollExtent;
    // Short content (nothing to scroll): treat as engaged once laid out —
    // same idea as web's onScroll init when the article is shorter than the
    // viewport (readProgress can already be ≥10).
    final pct = max <= 0
        ? 100
        : ((pos.pixels / max) * 100).clamp(0, 100).round();
    if (pct < 10) return;
    _trackSection(_activeSection);
  }

  void _trackSection(int section) {
    if (_trackedSections.contains(section)) return;
    final assetId = _assetIds[section.clamp(0, _assetIds.length - 1)];
    // Briefing must not fire on tab open alone (web requires ≥10% scroll).
    if (assetId == 'briefing' && _briefingTracked) return;
    _trackedSections.add(section);
    if (assetId == 'briefing') _briefingTracked = true;
    ref.read(progressProvider.notifier).trackAssetOpened(widget.partNumber, assetId);
  }

  // Built once — the sheet only depends on static AppColors values.
  static final MarkdownStyleSheet _markdownStyleSheet = MarkdownStyleSheet(
    // Body text
    p: const TextStyle(
      color: AppColors.textPrimary,
      fontSize: 15,
      height: 1.75,
      letterSpacing: 0.1,
    ),
    // Headings
    h1: const TextStyle(
      color: AppColors.textPrimary,
      fontSize: 22,
      fontWeight: FontWeight.w700,
      height: 1.3,
    ),
    h2: TextStyle(
      color: AppColors.gold,
      fontSize: 18,
      fontWeight: FontWeight.w700,
      height: 1.4,
    ),
    h3: const TextStyle(
      color: AppColors.textPrimary,
      fontSize: 16,
      fontWeight: FontWeight.w600,
      height: 1.4,
    ),
    h4: const TextStyle(
      color: AppColors.textSecondary,
      fontSize: 14,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.5,
    ),
    // Strong / em
    strong: const TextStyle(
      color: AppColors.textPrimary,
      fontWeight: FontWeight.w700,
    ),
    em: const TextStyle(
      color: AppColors.textSecondary,
      fontStyle: FontStyle.italic,
    ),
    // Code
    code: TextStyle(
      color: AppColors.goldLight,
      backgroundColor: AppColors.gold.withValues(alpha: 0.08),
      fontSize: 13,
      fontFamily: 'monospace',
    ),
    codeblockDecoration: BoxDecoration(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: AppColors.border),
    ),
    // Blockquote
    blockquote: const TextStyle(
      color: AppColors.textSecondary,
      fontSize: 15,
      fontStyle: FontStyle.italic,
      height: 1.6,
    ),
    blockquoteDecoration: BoxDecoration(
      color: AppColors.gold.withValues(alpha: 0.05),
      borderRadius: BorderRadius.circular(8),
      border: Border(
        left: BorderSide(color: AppColors.gold, width: 3),
      ),
    ),
    blockquotePadding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
    // Lists
    listBullet: const TextStyle(
      color: AppColors.gold,
      fontSize: 15,
    ),
    listBulletPadding: const EdgeInsets.only(right: 8),
    listIndent: 20,
    // Horizontal rule
    horizontalRuleDecoration: const BoxDecoration(
      border: Border(
        bottom: BorderSide(color: AppColors.border, width: 1),
      ),
    ),
    // Spacing
    pPadding: const EdgeInsets.only(bottom: 8),
    h1Padding: const EdgeInsets.only(bottom: 12, top: 8),
    h2Padding: const EdgeInsets.only(bottom: 8, top: 16),
    h3Padding: const EdgeInsets.only(bottom: 6, top: 12),
    blockSpacing: 12,
  );

  @override
  Widget build(BuildContext context) {
    final contentAsync = ref.watch(partContentProvider(widget.partNumber));

    return Column(
      children: [
        // Section selector
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: AppColors.border)),
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _sections.asMap().entries.map((e) {
                final selected = e.key == _activeSection;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Material(
                    color: selected ? AppColors.gold : AppColors.card,
                    borderRadius: BorderRadius.circular(20),
                    child: InkWell(
                      onTap: () {
                        setState(() => _activeSection = e.key);
                        // Reset scroll; tracking waits for ≥10% on new section.
                        if (_scrollController.hasClients) {
                          _scrollController.jumpTo(0);
                        }
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          if (mounted) _maybeTrackFromScroll();
                        });
                      },
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: selected ? AppColors.gold : AppColors.border,
                          ),
                        ),
                        child: Text(
                          e.value,
                          style: TextStyle(
                            color: selected ? Colors.black : AppColors.textSecondary,
                            fontSize: 13,
                            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),

        // Content
        Expanded(
          child: contentAsync.when(
            loading: () => _LoadingSkeleton(),
            error: (e, _) => _ErrorView(
              onRetry: () => ref.invalidate(partContentProvider(widget.partNumber)),
            ),
            data: (content) {
              final text = _activeSection == 0
                  ? content.briefingText
                  : _activeSection == 1
                      ? content.studyGuideText
                      : content.statementOfFactsText;

              if (text == null || text.isEmpty) {
                return _EmptySection(section: _sections[_activeSection]);
              }

              // Key Facts: plain newline-separated sentences → individual fact cards
              if (_activeSection == 2) {
                return _KeyFactsList(
                  text: text,
                  controller: _scrollController,
                  onLaidOut: () {
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      if (mounted) _maybeTrackFromScroll();
                    });
                  },
                );
              }

              return Markdown(
                controller: _scrollController,
                data: text,
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
                styleSheet: _markdownStyleSheet,
              );
            },
          ),
        ),
      ],
    );
  }
}

class _LoadingSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.card,
      highlightColor: AppColors.surface,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: List.generate(8, (i) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Container(
              height: 16,
              width: i.isEven ? double.infinity : MediaQuery.of(context).size.width * 0.75,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          )),
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorView({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: AppColors.textMuted),
          const SizedBox(height: 12),
          const Text('Failed to load content',
            style: TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 16),
          OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}

/// Renders newline-separated plain-text facts as numbered cards.
class _KeyFactsList extends StatelessWidget {
  final String text;
  final ScrollController controller;
  final VoidCallback onLaidOut;
  const _KeyFactsList({
    required this.text,
    required this.controller,
    required this.onLaidOut,
  });

  @override
  Widget build(BuildContext context) {
    final facts = text
        .split('\n')
        .map((l) => l.trim())
        .where((l) => l.isNotEmpty)
        .toList();

    WidgetsBinding.instance.addPostFrameCallback((_) => onLaidOut());

    return ListView.builder(
      controller: controller,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
      itemCount: facts.length,
      itemBuilder: (ctx, i) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Container(
            padding: const EdgeInsets.fromLTRB(14, 14, 16, 14),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Number badge
                Container(
                  width: 26,
                  height: 26,
                  margin: const EdgeInsets.only(top: 1, right: 12),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                  ),
                  child: Center(
                    child: Text(
                      '${i + 1}',
                      style: TextStyle(
                        color: AppColors.gold,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                // Fact text
                Expanded(
                  child: Text(
                    facts[i],
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 14,
                      height: 1.6,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _EmptySection extends StatelessWidget {
  final String section;
  const _EmptySection({required this.section});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.article_outlined, size: 48, color: AppColors.textMuted),
          const SizedBox(height: 12),
          Text('$section not available for this part',
            style: const TextStyle(color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}
