import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../l10n/app_strings.dart';

// ── Resource type definitions ─────────────────────────────────────────────────

class _ResourceType {
  final String id;
  final String titleKey;
  final String descKey;
  final IconData icon;
  final Color color;
  final bool requiresAccess;
  final bool showThumbnails;
  const _ResourceType({
    required this.id,
    required this.titleKey,
    required this.descKey,
    required this.icon,
    required this.color,
    this.requiresAccess = true,
    this.showThumbnails = false,
  });

  String title(String lang) => t(lang, titleKey);
  String description(String lang) => t(lang, descKey);
}

const _resourceTypes = [
  _ResourceType(
    id: 'video',
    titleKey: 'videos',
    descKey: 'watchFullVideoLesson',
    icon: Icons.play_circle_outline,
    color: Color(0xFF5A90B0),
    requiresAccess: false,
    showThumbnails: true,
  ),
  _ResourceType(
    id: 'audio',
    titleKey: 'audio',
    descKey: 'listenEveryLessonGo',
    icon: Icons.headphones_outlined,
    color: Color(0xFF9A7AB8),
  ),
  _ResourceType(
    id: 'briefing',
    titleKey: 'briefings',
    descKey: 'inDepthStudyNotes',
    icon: Icons.article_outlined,
    color: Color(0xFF4AA87E),
  ),
  _ResourceType(
    id: 'facts',
    titleKey: 'keyFacts',
    descKey: 'essentialFactsNumbered',
    icon: Icons.format_list_numbered_rounded,
    color: Color(0xFF6AAE50),
  ),
  _ResourceType(
    id: 'slides',
    titleKey: 'slides',
    descKey: 'detailedSlideDecks',
    icon: Icons.view_carousel_outlined,
    color: Color(0xFFD4A017),
  ),
  _ResourceType(
    id: 'infographics',
    titleKey: 'infographics',
    descKey: 'visualSummaryEachPart',
    icon: Icons.auto_awesome_mosaic_outlined,
    color: Color(0xFFB08040),
  ),
  _ResourceType(
    id: 'mindmap',
    titleKey: 'mindmaps',
    descKey: 'visualOverviewsConnecting',
    icon: Icons.account_tree_outlined,
    color: Color(0xFFC06060),
  ),
  _ResourceType(
    id: 'flashcards',
    titleKey: 'flashcards',
    descKey: 'spacedRepFlipCards',
    icon: Icons.style_outlined,
    color: Color(0xFF4AA87E),
  ),
  _ResourceType(
    id: 'quiz',
    titleKey: 'quizzes',
    descKey: 'testKnowledgeAfterLesson',
    icon: Icons.quiz_outlined,
    color: Color(0xFFE8C040),
  ),
];

/// Public so other screens (dashboard stat strip) can display the real count
/// instead of a hardcoded number that drifts whenever a resource type is
/// added/removed here.
final int kResourceTypeCount = _resourceTypes.length;

// ── Screen ────────────────────────────────────────────────────────────────────

class ResourcesScreen extends ConsumerStatefulWidget {
  const ResourcesScreen({super.key});

  @override
  ConsumerState<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends ConsumerState<ResourcesScreen> {
  String? _activeType;

  @override
  Widget build(BuildContext context) {
    final hasAccess = ref.watch(authProvider).hasAccess;
    final progress = ref.watch(progressProvider).valueOrNull;
    final lang = ref.watch(courseLangProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: _activeType == null
            ? Text(t(lang, 'resources'))
            : Text(_labelForType(_activeType!, lang)),
        leading: _activeType != null
            ? IconButton(
                icon: const BackIcon(),
                tooltip: t(lang, 'back'),
                onPressed: () => setState(() => _activeType = null),
              )
            : null,
      ),
      body: AppGradientBackground(
        child: SafeArea(
          child: _activeType == null
              ? _buildIndex(hasAccess, progress, lang)
              : _buildPartsList(_activeType!, hasAccess, progress, lang),
        ),
      ),
    );
  }

  // ── Index ─────────────────────────────────────────────────────────────────

  Widget _buildIndex(bool hasAccess, ProgressState? progress, String lang) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        // Stats strip
        if (progress != null && progress.totalViewed > 0) ...[
          _StatsStrip(progress: progress, lang: lang),
          const SizedBox(height: 14),
        ],

        Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Text(
            tv(lang, 'resourceTypesStat', {'n': _resourceTypes.length, 'parts': PARTS.length}),
            style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
        ),

        ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Column(
            children: _resourceTypes.asMap().entries.map((entry) {
              final i = entry.key;
              final rt = entry.value;
              final isLast = i == _resourceTypes.length - 1;
              final locked = rt.requiresAccess && !hasAccess;

              // Count completion for this resource type
              final badge = _badgeForType(rt.id, progress, lang);

              return Column(
                children: [
                  Material(
                    color: AppColors.card,
                    child: InkWell(
                      // push, not go — matches part_screen.dart's paywall
                      // fix so Back returns to Resources instead of wiping
                      // the back stack.
                      onTap: locked
                          ? () => context.push('/pricing')
                          : () => setState(() => _activeType = rt.id),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                        child: Row(
                          children: [
                            Container(
                              width: 38, height: 38,
                              decoration: BoxDecoration(
                                color: locked
                                    ? AppColors.border.withValues(alpha: 0.3)
                                    : rt.color.withValues(alpha: 0.18),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(rt.icon,
                                color: locked ? AppColors.textMuted : rt.color,
                                size: 20),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(rt.title(lang),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      color: locked ? AppColors.textSecondary : AppColors.textPrimary,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                    )),
                                  Text(rt.description(lang),
                                    style: const TextStyle(
                                      color: AppColors.textMuted, fontSize: 12, height: 1.3),
                                    maxLines: 1, overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (badge != null && !locked)
                              Container(
                                margin: const EdgeInsets.only(right: 8),
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.goldFaded,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(badge,
                                  style: const TextStyle(
                                    color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.w600)),
                              ),
                            locked
                                ? const Icon(Icons.lock_outline_rounded,
                                    color: AppColors.textMuted, size: 18)
                                : const ForwardChevronIcon(
                                    color: AppColors.textMuted, size: 18),
                          ],
                        ),
                      ),
                    ),
                  ),
                  if (!isLast)
                    const Divider(height: 1, thickness: 1, color: AppColors.border, indent: 68),
                ],
              );
            }).toList(),
          ),
        ).animate().fadeIn(duration: 350.ms),
      ],
    );
  }

  // ── Parts list ────────────────────────────────────────────────────────────

  Widget _buildPartsList(String typeId, bool hasAccess, ProgressState? progress, String lang) {
    final rt = _resourceTypes.firstWhere((r) => r.id == typeId);

    // Continue watching / last accessed for videos
    final continuePartNum = (typeId == 'video' && progress != null)
        ? _lastWatchedPart(progress)
        : null;

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      itemCount: PARTS.length + (continuePartNum != null ? 2 : 1),
      itemBuilder: (ctx, rawIndex) {
        final hasContinue = continuePartNum != null;
        int i = rawIndex;

        // Header row
        if (i == 0) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              tv(lang, 'nPartsTapToOpen', {'n': PARTS.length, 'type': rt.title(lang).toLowerCase()}),
              style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
          );
        }

        // Continue watching card (video only)
        if (hasContinue && i == 1) {
          final contPart = PARTS.firstWhere((p) => p.partNumber == continuePartNum);
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _ContinueWatchingCard(
              part: contPart,
              lang: lang,
              onTap: () => context.push('/part/${contPart.partNumber}?tab=video'),
            ),
          );
        }

        final partIndex = hasContinue ? i - 2 : i - 1;
        final part = PARTS[partIndex];
        final isLast = partIndex == PARTS.length - 1;
        final locked = part.partNumber > 1 && !hasAccess;
        final color = AppColors.forEra(part.era);
        final isFirst = partIndex == 0;

        final isViewed = progress?.viewedParts.contains(part.partNumber) ?? false;
        final isCompleted = progress?.completedParts.contains(part.partNumber) ?? false;

        return ClipRRect(
          borderRadius: BorderRadius.vertical(
            top: isFirst ? const Radius.circular(14) : Radius.zero,
            bottom: isLast ? const Radius.circular(14) : Radius.zero,
          ),
          child: Column(
            children: [
              Material(
                color: AppColors.card,
                child: InkWell(
                  // push, not go — matches part_screen.dart's paywall fix so
                  // Back returns to Resources instead of wiping the stack.
                  onTap: locked
                      ? () => context.push('/pricing')
                      : () => context.push('/part/${part.partNumber}?tab=$typeId'),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
                    child: Row(
                      children: [
                        // Thumbnail for videos, number badge for others
                        if (rt.showThumbnails && !locked)
                          _PartThumbnail(partNumber: part.partNumber, color: color)
                        else
                          Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(
                              color: locked
                                  ? AppColors.border.withValues(alpha: 0.2)
                                  : color.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(9),
                            ),
                            child: locked
                                ? Icon(Icons.lock_rounded, color: AppColors.textMuted, size: 15)
                                : Center(
                                    child: Text('${part.partNumber}',
                                      style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w800))),
                          ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(part.localizedTitle(lang),
                                style: TextStyle(
                                  color: locked ? AppColors.textSecondary : AppColors.textPrimary,
                                  fontSize: 14, fontWeight: FontWeight.w600),
                                maxLines: 1, overflow: TextOverflow.ellipsis,
                              ),
                              Text(part.localizedSubtitle(lang),
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                                maxLines: 1, overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Progress badge
                        if (!locked) ...[
                          if (isCompleted)
                            const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 16)
                          else if (isViewed)
                            Container(
                              width: 7, height: 7,
                              decoration: const BoxDecoration(color: AppColors.gold, shape: BoxShape.circle),
                            ),
                          const SizedBox(width: 8),
                        ],
                        Icon(
                          locked ? Icons.lock_outline_rounded : rt.icon,
                          color: locked ? AppColors.textMuted : rt.color,
                          size: 16,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              if (!isLast)
                const Divider(height: 1, thickness: 1, color: AppColors.border, indent: 64),
            ],
          ),
        );
      },
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  int? _lastWatchedPart(ProgressState progress) {
    if (progress.lastPartNumber != null) return progress.lastPartNumber;
    if (progress.viewedParts.isEmpty) return null;
    return progress.viewedParts.reduce((a, b) => a > b ? a : b);
  }

  String? _badgeForType(String typeId, ProgressState? progress, String lang) {
    if (progress == null) return null;
    final viewed = progress.totalViewed;
    if (viewed == 0) return null;
    if (typeId == 'quiz') {
      final passed = progress.totalCompleted;
      if (passed == 0) return null;
      return tv(lang, 'nPassed', {'n': passed});
    }
    return tv(lang, 'nViewedStudied', {'n': viewed});
  }

  String _labelForType(String id, String lang) =>
      _resourceTypes.firstWhere((r) => r.id == id).title(lang);
}

// ── Stats strip ───────────────────────────────────────────────────────────────

class _StatsStrip extends StatelessWidget {
  final ProgressState progress;
  final String lang;
  const _StatsStrip({required this.progress, required this.lang});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Expanded(child: _Stat('${progress.totalViewed}', t(lang, 'studied'))),
          _StatDivider(),
          Expanded(child: _Stat('${progress.totalCompleted}', t(lang, 'completed'))),
          _StatDivider(),
          Expanded(child: _Stat('${progress.quizScores.length}', t(lang, 'quizzesLabel'))),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String value;
  final String label;
  const _Stat(this.value, this.label);

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Text(value,
        maxLines: 1, overflow: TextOverflow.ellipsis,
        style: const TextStyle(color: AppColors.gold, fontSize: 18, fontWeight: FontWeight.w800)),
      const SizedBox(height: 2),
      Text(label,
        maxLines: 1, overflow: TextOverflow.ellipsis,
        style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
    ],
  );
}

class _StatDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) =>
      Container(width: 1, height: 28, color: AppColors.border);
}

// ── Continue Watching card ────────────────────────────────────────────────────

class _ContinueWatchingCard extends StatelessWidget {
  final dynamic part;
  final VoidCallback onTap;
  final String lang;
  const _ContinueWatchingCard({required this.part, required this.onTap, required this.lang});

  @override
  Widget build(BuildContext context) {
    final color = AppColors.forEra(part.era as String);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [color.withValues(alpha: 0.12), AppColors.card],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              Container(
                width: 52, height: 52,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Icon(Icons.play_arrow_rounded, color: color, size: 28),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(t(lang, 'continueWatching'),
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11, letterSpacing: 0.4)),
                    const SizedBox(height: 2),
                    Text(part.localizedTitle(lang) as String,
                      style: const TextStyle(
                        color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600),
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                    ),
                    Text('${tv(lang, "partN", {"n": part.partNumber})}  •  ${part.localizedSubtitle(lang)}',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Icon(Icons.play_circle_filled_rounded, color: color, size: 28),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Per-part thumbnail (lazy-loaded) ──────────────────────────────────────────

class _PartThumbnail extends ConsumerWidget {
  final int partNumber;
  final Color color;
  const _PartThumbnail({required this.partNumber, required this.color});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetsAsync = ref.watch(partAssetsProvider(partNumber));

    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: SizedBox(
        width: 56, height: 36,
        child: assetsAsync.whenOrNull(
          data: (assets) {
            if (assets.thumbnailUrl != null && assets.thumbnailUrl!.isNotEmpty) {
              return CachedNetworkImage(
                imageUrl: assets.thumbnailUrl!,
                fit: BoxFit.cover,
                memCacheWidth: (56 * MediaQuery.devicePixelRatioOf(context)).round(),
                placeholder: (_, __) => Container(color: AppColors.card),
                errorWidget: (_, __, ___) => _fallback(color),
              );
            }
            return _fallback(color);
          },
        ) ?? _fallback(color),
      ),
    );
  }

  Widget _fallback(Color color) => Container(
    color: color.withValues(alpha: 0.15),
    child: Center(
      child: Icon(Icons.play_circle_outline_rounded, color: color, size: 18),
    ),
  );
}
