/// The voluntary prayers the app knows about.
enum VoluntaryPrayer { duha, qiyam }

/// Times for the two voluntary (nafl) prayers the app displays alongside the
/// five daily prayers: Duha (forenoon) and Qiyam (night prayer).
///
/// These are *windows*, not obligatory prayer times, so they are kept apart
/// from `SalahPrayer` / `PrayerDayTimes`: none of the call-screen, snooze,
/// follow-up or completion machinery applies to them.
///
/// Any field may be null when the sun/night geometry at the user's location
/// does not yield a trustworthy value for that day (e.g. no sunrise within
/// the polar day) — the UI shows "not available" instead of a wrong time.
class VoluntaryPrayerTimes {
  /// Duha window for the calendar day: starts once the sun has risen well
  /// clear of the horizon and ends shortly before Dhuhr (zawal).
  final DateTime? duhaStart;
  final DateTime? duhaEnd;

  /// The upcoming night (the one whose Fajr is next): the start of its last
  /// third (the most virtuous time for Qiyam/Tahajjud), the Islamic
  /// midnight, and when the window closes (Fajr).
  final DateTime? qiyamStart;
  final DateTime? islamicMidnight;
  final DateTime? qiyamEnd;

  const VoluntaryPrayerTimes({
    this.duhaStart,
    this.duhaEnd,
    this.qiyamStart,
    this.islamicMidnight,
    this.qiyamEnd,
  });

  bool get hasDuha => duhaStart != null && duhaEnd != null;
  bool get hasQiyam => qiyamStart != null && qiyamEnd != null;

  /// True while [now] is inside the Duha window.
  bool isDuhaNow(DateTime now) =>
      hasDuha && !now.isBefore(duhaStart!) && now.isBefore(duhaEnd!);

  /// True while [now] is inside the last third of the night.
  bool isQiyamNow(DateTime now) =>
      hasQiyam && !now.isBefore(qiyamStart!) && now.isBefore(qiyamEnd!);
}
