import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_kit.dart';

// Resource type definitions
class _ResourceType {
  final String id;
  final String title;
  final String description;
  final IconData icon;
  final Color color;
  final bool requiresAccess;
  const _ResourceType({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
    this.requiresAccess = true,
  });
}

const _resourceTypes = [
  _ResourceType(
    id: 'video',
    title: 'Videos',
    description: 'Watch each part as a full video lesson',
    icon: Icons.play_circle_outline,
    color: Color(0xFF5A90B0),
    requiresAccess: false,
  ),
  _ResourceType(
    id: 'audio',
    title: 'Audio',
    description: 'Listen to every lesson on the go',
    icon: Icons.headphones_outlined,
    color: Color(0xFF9A7AB8),
  ),
  _ResourceType(
    id: 'briefing',
    title: 'Briefings',
    description: 'In-depth study notes for every part',
    icon: Icons.article_outlined,
    color: Color(0xFF4AA87E),
  ),
  _ResourceType(
    id: 'facts',
    title: 'Key Facts',
    description: 'Essential facts from each lesson, numbered',
    icon: Icons.format_list_numbered_rounded,
    color: Color(0xFF6AAE50),
  ),
  _ResourceType(
    id: 'slides',
    title: 'Slides',
    description: 'Detailed slide decks for every lesson',
    icon: Icons.view_carousel_outlined,
    color: Color(0xFFD4A017),
  ),
  _ResourceType(
    id: 'infographics',
    title: 'Infographics',
    description: 'Visual presentation slides for each part',
    icon: Icons.auto_awesome_mosaic_outlined,
    color: Color(0xFFB08040),
  ),
  _ResourceType(
    id: 'mindmap',
    title: 'Mindmaps',
    description: 'Visual overviews connecting key concepts',
    icon: Icons.account_tree_outlined,
    color: Color(0xFFC06060),
  ),
  _ResourceType(
    id: 'flashcards',
    title: 'Flashcards',
    description: 'Spaced-repetition flip cards for every lesson',
    icon: Icons.style_outlined,
    color: Color(0xFF4AA87E),
  ),
  _ResourceType(
    id: 'quiz',
    title: 'Quizzes',
    description: 'Test your knowledge after each lesson',
    icon: Icons.quiz_outlined,
    color: Color(0xFFE8C040),
  ),
];

class ResourcesScreen extends ConsumerStatefulWidget {
  const ResourcesScreen({super.key});

  @override
  ConsumerState<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends ConsumerState<ResourcesScreen> {
  String? _activeType; // null = index, otherwise show parts list for that type

  @override
  Widget build(BuildContext context) {
    final hasAccess = ref.watch(authProvider).hasAccess;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: _activeType == null
            ? const Text('Resources')
            : Text(_labelForType(_activeType!)),
        leading: _activeType != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () => setState(() => _activeType = null),
              )
            : null,
      ),
      body: AppGradientBackground(
        child: SafeArea(
          child: _activeType == null
              ? _buildIndex(hasAccess)
              : _buildPartsList(_activeType!, hasAccess),
        ),
      ),
    );
  }

  Widget _buildIndex(bool hasAccess) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        // Compact header
        Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Text(
            '${_resourceTypes.length} resource types • 100 parts each',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
        ),

        // Grouped list
        ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Column(
            children: _resourceTypes.asMap().entries.map((entry) {
              final i = entry.key;
              final rt = entry.value;
              final isLast = i == _resourceTypes.length - 1;
              final locked = rt.requiresAccess && !hasAccess;
              return Column(
                children: [
                  Material(
                    color: AppColors.card,
                    child: InkWell(
                      onTap: locked
                          ? () => context.go('/pricing')
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
                                  Text(rt.title,
                                    style: TextStyle(
                                      color: locked
                                          ? AppColors.textSecondary
                                          : AppColors.textPrimary,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                    )),
                                  Text(rt.description,
                                    style: const TextStyle(
                                      color: AppColors.textMuted,
                                      fontSize: 12,
                                      height: 1.3,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Icon(
                              locked ? Icons.lock_outline_rounded : Icons.chevron_right_rounded,
                              color: AppColors.textMuted,
                              size: 18,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  if (!isLast)
                    const Divider(height: 1, thickness: 1, color: AppColors.border,
                      indent: 68, endIndent: 0),
                ],
              );
            }).toList(),
          ),
        ).animate().fadeIn(duration: 350.ms),
      ],
    );
  }

  Widget _buildPartsList(String typeId, bool hasAccess) {
    final rt = _resourceTypes.firstWhere((r) => r.id == typeId);

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      itemCount: PARTS.length + 1,
      itemBuilder: (ctx, i) {
        if (i == 0) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              '${PARTS.length} parts  •  Tap any part to open ${rt.title.toLowerCase()}',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
          );
        }
        final part = PARTS[i - 1];
        final isLast = i == PARTS.length;
        final locked = part.partNumber > 1 && !hasAccess;
        final color = AppColors.forEra(part.era);
        final isFirst = i == 1;

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
                  onTap: locked
                      ? () => context.go('/pricing')
                      : () => context.push('/part/${part.partNumber}?tab=$typeId'),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        Container(
                          width: 36, height: 36,
                          decoration: BoxDecoration(
                            color: locked
                                ? AppColors.border.withValues(alpha: 0.2)
                                : color.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(9),
                          ),
                          child: locked
                              ? Icon(Icons.lock_rounded,
                                  color: AppColors.textMuted, size: 15)
                              : Center(
                                  child: Text('${part.partNumber}',
                                    style: TextStyle(
                                      color: color, fontSize: 13,
                                      fontWeight: FontWeight.w800))),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(part.title,
                                style: TextStyle(
                                  color: locked
                                      ? AppColors.textSecondary
                                      : AppColors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(part.subtitle,
                                style: const TextStyle(
                                  color: AppColors.textMuted, fontSize: 12),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          locked ? Icons.lock_outline_rounded : rt.icon,
                          color: locked ? AppColors.textMuted : rt.color,
                          size: 17,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              if (!isLast)
                const Divider(height: 1, thickness: 1, color: AppColors.border,
                  indent: 64, endIndent: 0),
            ],
          ),
        );
      },
    );
  }

  String _labelForType(String id) {
    return _resourceTypes.firstWhere((r) => r.id == id).title;
  }
}
