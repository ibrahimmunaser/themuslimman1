import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';

import '../models/prayer_day_times.dart';
import '../models/salah_prayer.dart';
import '../models/voluntary_prayer_times.dart';
import '../utils/app_theme.dart';
import '../utils/formatting.dart';
import '../../../core/theme/app_colors.dart';

/// Today's five prayer times, highlighting the upcoming one.
///
/// Each row uses that prayer's own palette so Fajr–Isha read as distinct
/// atmospheres; the next prayer gets a stronger tint and border. When
/// [voluntaryTimes] is provided, Duha and Qiyam are woven into the same
/// list at their natural chronological spot (Duha right after Fajr, Qiyam
/// right after Isha) rather than living in a section of their own — they
/// still read as lighter/voluntary rows, just inline with the five.
class PrayerTimesList extends StatelessWidget {
  final PrayerDayTimes day;
  final SalahPrayer? highlighted;
  final VoluntaryPrayerTimes? voluntaryTimes;
  final DateTime? now;

  const PrayerTimesList({
    super.key,
    required this.day,
    this.highlighted,
    this.voluntaryTimes,
    this.now,
  });

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    final v = voluntaryTimes;
    final nowValue = now;

    for (final entry in day.orderedEntries) {
      final prayer = entry.key;
      rows.add(_PrayerRow(prayer: prayer, time: entry.value, isNext: prayer == highlighted));

      if (prayer == SalahPrayer.fajr && v != null && nowValue != null) {
        rows.add(
          _VoluntaryRow(
            icon: Icons.wb_sunny_rounded,
            name: 'Duha',
            start: v.duhaStart,
            end: v.duhaEnd,
            isNow: v.isDuhaNow(nowValue),
          ),
        );
      }

      if (prayer == SalahPrayer.isha && v != null && nowValue != null) {
        rows.add(
          _VoluntaryRow(
            icon: Icons.bedtime_rounded,
            name: 'Qiyam',
            start: v.qiyamStart,
            end: v.qiyamEnd,
            isNow: v.isQiyamNow(nowValue),
          ),
        );
      }
    }

    return Column(children: rows);
  }
}

class _PrayerRow extends StatelessWidget {
  final SalahPrayer prayer;
  final DateTime time;
  final bool isNext;

  const _PrayerRow({
    required this.prayer,
    required this.time,
    required this.isNext,
  });

  @override
  Widget build(BuildContext context) {
    final theme = AppTheme.forPrayer(prayer);
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 3),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color:
            isNext
                ? theme.listTint.withValues(alpha: 0.12)
                : theme.listTint.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
        border:
            isNext
                ? Border.all(color: theme.accent, width: 1.2)
                : Border.all(
                  color: theme.listTint.withValues(alpha: 0.14),
                  width: 1,
                ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(
                _iconFor(prayer),
                size: 20,
                color: isNext ? theme.primary : theme.primary.withValues(alpha: 0.72),
              ),
              const SizedBox(width: 12),
              Text(
                prayer.displayName,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: isNext ? FontWeight.w700 : FontWeight.w500,
                  color: isNext ? theme.accent : AppColors.textPrimary,
                ),
              ),
            ],
          ),
          Text(
            formatTime(time),
            style: TextStyle(
              fontSize: 16,
              fontWeight: isNext ? FontWeight.w700 : FontWeight.w500,
              color: isNext ? theme.accent : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  IconData _iconFor(SalahPrayer prayer) {
    switch (prayer) {
      case SalahPrayer.fajr:
        return Icons.wb_twilight;
      case SalahPrayer.dhuhr:
        return Icons.wb_sunny_outlined;
      case SalahPrayer.asr:
        return Icons.sunny_snowing;
      case SalahPrayer.maghrib:
        return Icons.nights_stay_outlined;
      case SalahPrayer.isha:
        return Icons.dark_mode_outlined;
    }
  }
}

/// Duha/Qiyam row, inline within the five-prayer list.
///
/// Deliberately lighter than the obligatory rows: these are voluntary
/// windows (a start and an end), they carry no reminder/call behaviour, and
/// the one currently open gets a small "now" accent instead of the
/// next-prayer highlight.
class _VoluntaryRow extends StatelessWidget {
  final IconData icon;
  final String name;
  final DateTime? start;
  final DateTime? end;
  final bool isNow;

  const _VoluntaryRow({
    required this.icon,
    required this.name,
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
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(
                icon,
                size: 20,
                color: AppColors.gold.withValues(alpha: isNow ? 1 : 0.75),
              ),
              const SizedBox(width: 12),
              Text(
                name,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: isNow ? FontWeight.w700 : FontWeight.w500,
                  color: isNow ? AppColors.gold : AppColors.textPrimary,
                ),
              ),
            ],
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
            )
          else
            Text(
              'Not available today',
              style: TextStyle(fontSize: 12, color: AppColors.textMuted),
            ),
        ],
      ),
    );
  }
}
