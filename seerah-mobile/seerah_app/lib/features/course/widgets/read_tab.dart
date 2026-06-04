import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/theme/app_colors.dart';
import 'package:shimmer/shimmer.dart';

class ReadTab extends ConsumerStatefulWidget {
  final int partNumber;
  const ReadTab({super.key, required this.partNumber});

  @override
  ConsumerState<ReadTab> createState() => _ReadTabState();
}

class _ReadTabState extends ConsumerState<ReadTab> {
  int _activeSection = 0;
  final List<String> _sections = ['Briefing', 'Study Guide', 'Key Facts'];

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
          child: Row(
            children: _sections.asMap().entries.map((e) {
              final selected = e.key == _activeSection;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => setState(() => _activeSection = e.key),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.gold : AppColors.card,
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
              );
            }).toList(),
          ),
        ),

        // Content
        Expanded(
          child: contentAsync.when(
            loading: () => _LoadingSkeleton(),
            error: (e, _) => _ErrorView(onRetry: () => ref.invalidate(partContentProvider(widget.partNumber))),
            data: (content) {
              String? text;
              if (_activeSection == 0) text = content.briefingText;
              if (_activeSection == 1) text = content.studyGuideText;
              if (_activeSection == 2) text = content.statementOfFactsText;

              if (text == null || text.isEmpty) {
                return _EmptySection(section: _sections[_activeSection]);
              }

              return ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Text(
                    text,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 15,
                      height: 1.8,
                      letterSpacing: 0.1,
                    ),
                  ),
                ],
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
          const Text('Failed to load content', style: TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 16),
          OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
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
