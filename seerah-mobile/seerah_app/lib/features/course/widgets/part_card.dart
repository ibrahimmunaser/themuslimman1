import 'package:flutter/material.dart';
import '../../../core/models/part_model.dart';
import '../../../core/theme/app_colors.dart';

class PartCard extends StatelessWidget {
  final PartModel part;
  final VoidCallback onTap;
  final bool isLocked;
  /// When true, renders as a grouped-list row (no standalone card border).
  /// Pass isFirst/isLast to round the appropriate corners.
  final bool grouped;
  final bool isFirst;
  final bool isLast;

  const PartCard({
    super.key,
    required this.part,
    required this.onTap,
    this.isLocked = false,
    this.grouped = false,
    this.isFirst = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = AppColors.forEra(part.era);

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
        child: Opacity(
          opacity: isLocked ? 0.72 : 1.0,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 38, height: 38,
                  decoration: BoxDecoration(
                    color: isLocked
                        ? AppColors.border.withValues(alpha: 0.2)
                        : color.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: isLocked
                        ? Icon(Icons.lock_rounded,
                            color: color.withValues(alpha: 0.6), size: 16)
                        : Text(
                            '${part.partNumber}',
                            style: TextStyle(
                              color: color,
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
                        part.title,
                        style: TextStyle(
                          color: isLocked
                              ? AppColors.textSecondary
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
                        part.subtitle,
                        style: const TextStyle(
                            color: AppColors.textMuted, fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  isLocked
                      ? Icons.lock_outline_rounded
                      : Icons.chevron_right_rounded,
                  color: AppColors.textMuted,
                  size: 18,
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (!grouped) {
      // Standalone card (search results)
      return ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: row,
      );
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
          const Divider(
              height: 1, thickness: 1, color: AppColors.border, indent: 66),
      ],
    );
  }
}
