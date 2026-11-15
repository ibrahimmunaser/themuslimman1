import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/data/parts_titles_fr.dart';
import '../../../core/models/part_model.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/profile_avatar_button.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../l10n/app_strings.dart';
import '../widgets/continue_learning_card.dart';
import '../widgets/part_card.dart';

class CourseScreen extends ConsumerStatefulWidget {
  const CourseScreen({super.key});

  @override
  ConsumerState<CourseScreen> createState() => _CourseScreenState();
}

class _CourseScreenState extends ConsumerState<CourseScreen> {
  String _search = '';
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(courseLangProvider);
    final hasAccess = ref.watch(authProvider).hasAccess;
    final progressAsync = ref.watch(progressProvider);
    final progress = progressAsync.valueOrNull;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: context.canPop()
            ? IconButton(
                icon: const BackIcon(),
                tooltip: t(lang, 'back'),
                onPressed: () => context.pop(),
              )
            : null,
        title: Text(t(lang, 'lessons')),
        actions: const [ProfileAvatarButton()],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(72),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: AppSearchField(
              controller: _searchCtrl,
              onChanged: (v) => setState(() => _search = v.toLowerCase()),
              onClear: _search.isNotEmpty
                  ? () {
                      _searchCtrl.clear();
                      setState(() => _search = '');
                    }
                  : null,
              hint: t(lang, 'searchPartsEllipsis'),
            ),
          ),
        ),
      ),
      body: AppGradientBackground(
        child: SafeArea(
          bottom: false,
          child: _search.isNotEmpty
              ? _buildSearchResults(hasAccess, progress, lang)
              : _buildEraList(hasAccess, progress, progressAsync, lang),
        ),
      ),
    );
  }

  Widget _buildEraList(
    bool hasAccess,
    ProgressState? progress,
    AsyncValue<ProgressState> progressAsync,
    String lang,
  ) {
    final groups = getEraGroups();
    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 12),
      itemCount: groups.length + 1,
      itemBuilder: (ctx, i) {
        if (i == 0) {
          return Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ContinueLearningCard(
                  hasAccess: hasAccess,
                  progressAsync: progressAsync,
                  lang: lang,
                ),
                if (progress != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    tv(lang, 'nOfNCompleted', {
                      'done': progress.totalCompleted,
                      'total': PARTS.length,
                    }),
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
          );
        }
        final group = groups[i - 1];
        final era = group['era'] as EraModel;
        final parts = group['parts'] as List<PartModel>;
        return _EraSection(
          era: era,
          parts: parts,
          hasAccess: hasAccess,
          progress: progress,
          lang: lang,
        );
      },
    );
  }

  Widget _buildSearchResults(
    bool hasAccess,
    ProgressState? progress,
    String lang,
  ) {
    final results = PARTS.where((p) {
      final fr = kPartTitlesFr[p.partNumber];
      return p.localizedTitle(lang).toLowerCase().contains(_search) ||
          p.localizedSubtitle(lang).toLowerCase().contains(_search) ||
          p.title.toLowerCase().contains(_search) ||
          p.subtitle.toLowerCase().contains(_search) ||
          (p.titleAr?.contains(_search) ?? false) ||
          (p.subtitleAr?.contains(_search) ?? false) ||
          (fr?.title.toLowerCase().contains(_search) ?? false) ||
          (fr?.subtitle.toLowerCase().contains(_search) ?? false) ||
          p.description.toLowerCase().contains(_search) ||
          'part ${p.partNumber}'.contains(_search);
    }).toList();

    if (results.isEmpty) {
      return EmptyState(
        icon: Icons.search_off_rounded,
        title: t(lang, 'noPartsFound'),
        subtitle: t(lang, 'tryDifferentSearch'),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      itemCount: results.length,
      itemBuilder: (ctx, i) {
        final p = results[i];
        final locked =
            p.partNumber != AppConstants.kFreePartNumber && !hasAccess;
        return Padding(
          padding: const EdgeInsets.only(bottom: 1),
          child: PartCard(
            part: p,
            isLocked: locked,
            grouped: true,
            isFirst: i == 0,
            isLast: i == results.length - 1,
            isViewed: progress?.viewedParts.contains(p.partNumber) ?? false,
            isCompleted:
                progress?.completedParts.contains(p.partNumber) ?? false,
            onTap: () => context.push('/part/${p.partNumber}'),
          ),
        );
      },
    );
  }
}

class _EraSection extends StatefulWidget {
  final EraModel era;
  final List<PartModel> parts;
  final bool hasAccess;
  final ProgressState? progress;
  final String lang;
  const _EraSection({
    required this.era,
    required this.parts,
    required this.hasAccess,
    this.progress,
    required this.lang,
  });

  @override
  State<_EraSection> createState() => _EraSectionState();
}

class _EraSectionState extends State<_EraSection> {
  bool _expanded = false;

  @override
  void initState() {
    super.initState();
    // Auto-expand the first era (pre-islamic)
    _expanded = widget.era.id == 'pre-islamic';
  }

  @override
  Widget build(BuildContext context) {
    final color = AppColors.forEra(widget.era.id);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Era header
        InkWell(
          onTap: () => setState(() => _expanded = !_expanded),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              border: BorderDirectional(
                start: BorderSide(color: color, width: 3),
                bottom: BorderSide(color: AppColors.border),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.era.localizedName(widget.lang),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        tv(widget.lang, 'nPartsSuffix', {
                          'n': widget.parts.length,
                        }),
                        style: TextStyle(
                          color: color,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                AnimatedRotation(
                  turns: _expanded ? 0.5 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    Icons.keyboard_arrow_down,
                    color: AppColors.textMuted,
                    size: 22,
                  ),
                ),
              ],
            ),
          ),
        ),

        // Parts list
        // AnimatedSize + conditional child (instead of AnimatedCrossFade):
        // CrossFade builds BOTH children permanently, so every collapsed era
        // was still building all of its PartCards (~100 rows on first paint).
        // Here the rows only exist while the era is open.
        AnimatedSize(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
          alignment: Alignment.topCenter,
          child: !_expanded
              ? const SizedBox(width: double.infinity)
              : Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                  child: Column(
                    children: widget.parts.asMap().entries.map((e) {
                      final i = e.key;
                      final p = e.value;
                      final locked =
                          p.partNumber != AppConstants.kFreePartNumber &&
                          !widget.hasAccess;
                      return PartCard(
                        part: p,
                        isLocked: locked,
                        grouped: true,
                        isFirst: i == 0,
                        isLast: i == widget.parts.length - 1,
                        isViewed:
                            widget.progress?.viewedParts.contains(
                              p.partNumber,
                            ) ??
                            false,
                        isCompleted:
                            widget.progress?.completedParts.contains(
                              p.partNumber,
                            ) ??
                            false,
                        onTap: () => context.push('/part/${p.partNumber}'),
                      );
                    }).toList(),
                  ),
                ),
        ),
      ],
    );
  }
}
