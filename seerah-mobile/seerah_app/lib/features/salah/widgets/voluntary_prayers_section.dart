import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';

import '../../../core/theme/app_colors.dart';
import '../models/voluntary_prayer_times.dart';
import '../utils/formatting.dart';

/// Duha and Qiyam under the five daily prayers.
///
/// Deliberately lighter than the obligatory rows: these are voluntary
/// windows (a start and an end), they carry no reminder/call behaviour, and
/// the one currently open gets a small "now" accent instead of the
/// next-prayer highlight.
class VoluntaryPrayersSection extends StatelessWidget {
  final VoluntaryPrayerTimes? times;
  final DateTime now;

  const VoluntaryPrayersSection({
    super.key,
    required this.times,
    required this.now,
  });

  @override
  Widget build(BuildContext context) {
    final t = times;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 14),
        Text(
          'Voluntary prayers',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.4,
            color: AppColors.gold,
          ),
        ),
        const SizedBox(height: 4),
        _VoluntaryRow(
          icon: Icons.wb_sunny_rounded,
          name: 'Duha',
          subtitle: 'Forenoon prayer',
          start: t?.duhaStart,
          end: t?.duhaEnd,
          isNow: t?.isDuhaNow(now) ?? false,
        ),
        _VoluntaryRow(
          icon: Icons.bedtime_rounded,
          name: 'Qiyam',
          subtitle: 'Last third of the night',
          start: t?.qiyamStart,
          end: t?.qiyamEnd,
          isNow: t?.isQiyamNow(now) ?? false,
        ),
      ],
    );
  }
}

class _VoluntaryRow extends StatelessWidget {
  final IconData icon;
  final String name;
  final String subtitle;
  final DateTime? start;
  final DateTime? end;
  final bool isNow;

  const _VoluntaryRow({
    required this.icon,
    required this.name,
    required this.subtitle,
    required this.start,
    required this.end,
    required this.isNow,
  });

  @override
  Widget build(BuildContext context) {
    final available = start != null && end != null;
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 3),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: isNow ? 0.12 : 0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.gold.withValues(alpha: isNow ? 1 : 0.18),
          width: isNow ? 1.2 : 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            size: 20,
            color: AppColors.gold.withValues(alpha: isNow ? 1 : 0.75),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: isNow ? FontWeight.w700 : FontWeight.w500,
                    color: isNow ? AppColors.gold : AppColors.textPrimary,
                  ),
                ),
                Text(
                  available
                      ? subtitle
                      : 'Not available at this latitude today',
                  style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          if (available)
            Directionality(
              // Times are numerals + Latin AM/PM; keep them left-to-right
              // inside an RTL layout so "5:12 AM – 7:40 AM" doesn't flip.
              textDirection: TextDirection.ltr,
              child: Text(
                '${formatTime(start!)} – ${formatTime(end!)}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isNow ? FontWeight.w700 : FontWeight.w500,
                  color: isNow ? AppColors.gold : AppColors.textPrimary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
