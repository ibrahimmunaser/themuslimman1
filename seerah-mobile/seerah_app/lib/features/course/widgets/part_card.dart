import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../l10n/course_numbers.dart';
import '../../../core/models/part_model.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/adaptive_icons.dart';

class PartCard extends ConsumerWidget {
  final PartModel part;
  final VoidCallback onTap;
  final bool isLocked;

  /// When true, renders as a grouped-list row (no standalone card border).
  /// Pass isFirst/isLast to round the appropriate corners.
  final bool grouped;
  final bool isFirst;
  final bool isLast;

  /// Whether the user has opened this part at least once.
  final bool isViewed;

  /// Whether the user has passed the quiz for this part.
  final bool isCompleted;

  const PartCard({
    super.key,
    required this.part,
    required this.onTap,
    this.isLocked = false,
    this.grouped = false,
    this.isFirst = false,
    this.isLast = false,
    this.isViewed = false,
    this.isCompleted = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(courseLangProvider);
    final color = AppColors.forEra(part.era);
    // Locked rows are dimmed by fading each colour instead of wrapping the
    // row in Opacity(0.72): Opacity forces an offscreen saveLayer per row,
    // which adds up across a long scrolling list. Same look, no layer.
    Color dim(Color c) => isLocked ? c.withValues(alpha: c.a * 0.72) : c;

    final row = Material(
      color: AppColors.card,
      child: InkWell(
        onTap: onTap,
        borderRadius: grouped
            ? BorderRadius.vertical(
                top: isFirst ? const Radius.circular(14) : Radius.zero,
                bottom: isLast ? const Radius.circular(14) : Radius.zero,
              )
            : BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: isLocked
                      ? dim(AppColors.border.withValues(alpha: 0.2))
                      : dim(color.withValues(alpha: 0.18)),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: isLocked
                      ? Icon(
                          Icons.lock_rounded,
                          color: dim(color.withValues(alpha: 0.6)),
                          size: 16,
                        )
                      : Text(
                          formatCourseNumber(lang, part.partNumber),
                          style: TextStyle(
                            color: dim(color),
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      part.localizedTitle(lang),
                      style: TextStyle(
                        color: isLocked
                            ? dim(AppColors.textSecondary)
                            : AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      part.localizedSubtitle(lang),
                      style: TextStyle(
                        color: dim(AppColors.textMuted),
                        fontSize: 12,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (isCompleted)
                const Icon(
                  Icons.check_circle_rounded,
                  color: AppColors.success,
                  size: 18,
                )
              else if (isViewed && !isLocked)
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppColors.gold,
                    shape: BoxShape.circle,
                  ),
                )
              else if (isLocked)
                Icon(
                  Icons.lock_outline_rounded,
                  color: dim(AppColors.textMuted),
                  size: 18,
                )
              else
                ForwardChevronIcon(color: AppColors.textMuted, size: 18),
            ],
          ),
        ),
      ),
    );

    if (!grouped) {
      // Standalone card (search results)
      return ClipRRect(borderRadius: BorderRadius.circular(14), child: row);
    }

    // Grouped row — caller wraps in ClipRRect for the group container
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.vertical(
            top: isFirst ? const Radius.circular(14) : Radius.zero,
            bottom: isLast ? const Radius.circular(14) : Radius.zero,
          ),
          child: row,
        ),
        if (!isLast)
          Divider(height: 1, thickness: 1, color: AppColors.border, indent: 66),
      ],
    );
  }
}
