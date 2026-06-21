import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';

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
    title: 'Video Lessons',
    description: 'Watch each part as a full video lesson',
    icon: Icons.play_circle_outline,
    color: Color(0xFF5A90B0),
    requiresAccess: false,
  ),
  _ResourceType(
    id: 'read',
    title: 'Briefings & Study Guides',
    description: 'Read-along notes, briefings, and study guides',
    icon: Icons.article_outlined,
    color: Color(0xFF4AA87E),
  ),
  _ResourceType(
    id: 'flashcards',
    title: 'Flashcards',
    description: 'Memorize key facts with flippable flashcards',
    icon: Icons.style_outlined,
    color: Color(0xFFB08040),
  ),
  _ResourceType(
    id: 'quiz',
    title: 'Quizzes',
    description: 'Test your knowledge after each lesson',
    icon: Icons.quiz_outlined,
    color: Color(0xFFC06060),
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
      appBar: AppBar(
        title: _activeType == null
            ? const Text('Resources')
            : Text(_labelForType(_activeType!)),
        leading: _activeType != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() => _activeType = null),
              )
            : null,
      ),
      body: _activeType == null
          ? _buildIndex(hasAccess)
          : _buildPartsList(_activeType!, hasAccess),
    );
  }

  Widget _buildIndex(bool hasAccess) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Header
        Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Resource Library',
                style: TextStyle(color: AppColors.gold, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 1)),
              SizedBox(height: 6),
              Text('Everything you need to learn the Seerah',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
              SizedBox(height: 4),
              Text('Videos, reading notes, flashcards, and quizzes — one for every part.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
            ],
          ),
        ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.05, end: 0),

        // Resource type cards
        ..._resourceTypes.asMap().entries.map((entry) {
          final i = entry.key;
          final rt = entry.value;
          final locked = rt.requiresAccess && !hasAccess;

          return GestureDetector(
            onTap: locked
                ? () => context.go('/pricing')
                : () => setState(() => _activeType = rt.id),
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: locked ? AppColors.border : rt.color.withOpacity(0.3),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(
                      color: locked ? AppColors.border.withOpacity(0.3) : rt.color.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: locked ? AppColors.border : rt.color.withOpacity(0.4)),
                    ),
                    child: Icon(rt.icon,
                      color: locked ? AppColors.textMuted : rt.color, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(rt.title,
                              style: TextStyle(
                                color: locked ? AppColors.textSecondary : AppColors.textPrimary,
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                              )),
                            if (locked) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.gold.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: AppColors.gold.withOpacity(0.3)),
                                ),
                                child: const Text('Full Access',
                                  style: TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.w600)),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(rt.description,
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.3)),
                        const SizedBox(height: 6),
                        Text('100 parts available',
                          style: TextStyle(color: rt.color.withOpacity(locked ? 0.4 : 0.8), fontSize: 11, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                  Icon(
                    locked ? Icons.lock_outline : Icons.chevron_right,
                    color: locked ? AppColors.textMuted : AppColors.textSecondary,
                    size: 20,
                  ),
                ],
              ),
            ).animate(delay: (i * 60).ms).fadeIn(duration: 400.ms).slideX(begin: 0.03, end: 0),
          );
        }),

        const SizedBox(height: 16),

        // Tip card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.goldFaded,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.gold.withOpacity(0.2)),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.lightbulb_outline, color: AppColors.gold, size: 18),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Every part follows the same path: Watch → Study → Review → Quiz. Use all four to get the most out of each lesson.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
                ),
              ),
            ],
          ),
        ).animate(delay: 300.ms).fadeIn(duration: 400.ms),
      ],
    );
  }

  Widget _buildPartsList(String typeId, bool hasAccess) {
    final rt = _resourceTypes.firstWhere((r) => r.id == typeId);

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: PARTS.length,
      itemBuilder: (ctx, i) {
        final part = PARTS[i];
        final locked = part.partNumber > 1 && !hasAccess;
        final color = AppColors.forEra(part.era);

        return GestureDetector(
          onTap: locked
              ? () => context.go('/pricing')
              : () => context.push('/part/${part.partNumber}'),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: locked ? AppColors.border : color.withOpacity(0.25)),
            ),
            child: Row(
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: locked ? AppColors.border.withOpacity(0.2) : color.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: locked
                      ? const Icon(Icons.lock, color: AppColors.textMuted, size: 16)
                      : Center(child: Text('${part.partNumber}',
                          style: TextStyle(color: color, fontSize: 14, fontWeight: FontWeight.w800))),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(part.title,
                        style: TextStyle(
                          color: locked ? AppColors.textSecondary : AppColors.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(part.subtitle,
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Icon(rt.icon, color: locked ? AppColors.textMuted : rt.color, size: 18),
              ],
            ),
          ),
        );
      },
    );
  }

  String _labelForType(String id) {
    return _resourceTypes.firstWhere((r) => r.id == id).title;
  }
}
