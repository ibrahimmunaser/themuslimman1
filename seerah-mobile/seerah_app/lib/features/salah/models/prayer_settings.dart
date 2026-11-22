import 'dua.dart';
import 'salah_prayer.dart';

/// Supported calculation methods (app-level, mapped to adhan_dart in the
/// prayer time service).
///
/// Only mainstream Sunni conventions are exposed. Sect-specific methods
/// (Jafari / Ithna-Ashari / Qum / Tehran, Ahmadiyya, etc.) are intentionally
/// excluded and must not be added to this list.
enum CalculationMethodOption {
  isna('North America (ISNA)'),
  muslimWorldLeague('Muslim World League'),
  ummAlQura('Umm al-Qura (Makkah)'),
  karachi('Karachi (Univ. of Islamic Sciences)'),
  egyptian('Egyptian General Authority'),
  diyanet('Diyanet (Turkiye)'),
  jakim('JAKIM (Malaysia)'),
  muis('MUIS (Singapore)'),
  kemenag('Kemenag (Indonesia)'),
  tunisia('Tunisia Ministry of Religious Affairs'),
  algeria('Algeria Ministry of Religious Affairs'),
  russia('Spiritual Administration of Muslims of Russia'),
  custom('Custom Sunni Angles');

  final String displayName;

  const CalculationMethodOption(this.displayName);
}

/// Asr juristic method.
enum AsrMethod {
  standard("Standard (Shafi'i, Maliki, Hanbali)"),
  hanafi('Hanafi');

  final String displayName;

  const AsrMethod(this.displayName);
}

/// Rule for Fajr/Isha at high latitudes where twilight may persist.
enum HighLatitudeRuleOption {
  middleOfTheNight('Middle of the night'),
  seventhOfTheNight('One seventh of the night'),
  twilightAngle('Twilight angle');

  final String displayName;

  const HighLatitudeRuleOption(this.displayName);
}

/// Arabic typeface used for Quran verse text (Full Quran reader + Surah
/// reader + verse popups). Purely cosmetic — never affects verse content.
enum QuranFontOption {
  amiriQuran(
    'Amiri Quran',
    'Traditional Uthmani mushaf calligraphy',
  ),
  scheherazadeNew(
    'Scheherazade New',
    'Classic Naskh style, very readable',
  ),
  lateef(
    'Lateef',
    'Simpler, more modern Naskh',
  ),
  notoNaskhArabic(
    'Noto Naskh Arabic',
    'Clean, widely used for Quran apps',
  );

  final String displayName;
  final String description;

  const QuranFontOption(this.displayName, this.description);
}

/// How the location was chosen.
enum LocationSource {
  device('Device location'),
  manualCity('Manual city'),
  manualCoordinates('Manual coordinates');

  final String displayName;

  const LocationSource(this.displayName);
}

/// All user-configurable prayer calculation and reminder settings.
class PrayerSettings {
  final double? latitude;
  final double? longitude;

  /// Human-readable label for the location (city name or "lat, lng").
  final String? locationLabel;
  final LocationSource locationSource;

  /// IANA timezone identifier, e.g. "America/New_York".
  final String? timezone;

  final CalculationMethodOption calculationMethod;
  final AsrMethod asrMethod;
  final HighLatitudeRuleOption highLatitudeRule;

  /// Custom angles, used only when [calculationMethod] is custom.
  final double customFajrAngle;
  final double customIshaAngle;

  /// Manual minute offsets per prayer, e.g. {fajr: 2, asr: -1}.
  final Map<SalahPrayer, int> manualAdjustments;

  final bool notificationsEnabled;

  /// Whether the full-screen "incoming call" presentation (the in-app
  /// Answer/Decline screen, plus the Android full-screen-intent/direct-launch
  /// takeover that leads to it) is shown when a prayer enters. When false,
  /// the ordinary prayer notification still fires exactly as before — only
  /// the full-screen takeover is suppressed; Pray Now / Decline remain
  /// available as actions on that notification.
  final bool callScreenEnabled;

  /// Opt-in gentle notifications when the Duha window opens / the last third
  /// of the night begins. Off by default; plain notifications only — never
  /// the call screen, snooze or follow-ups. Only effective while
  /// [notificationsEnabled] is on.
  final bool duhaReminderEnabled;
  final bool qiyamReminderEnabled;

  /// Opt-in "du'a for loved ones" reminders (the righteous-child reminder).
  /// Off by default. A plain notification at each selected [duaWindows]
  /// time; tapping it opens a calm timed card (never the call screen) that
  /// stays up for [duaCardSeconds]. Only effective while
  /// [notificationsEnabled] is on.
  final bool duaReminderEnabled;
  final List<DuaWindow> duaWindows;

  /// How long the du'a card stays up: 30 or 60 seconds.
  final int duaCardSeconds;

  /// Snooze duration in minutes.
  final int snoozeMinutes;

  /// Displayed Hijri date offset in days (-2..+2) to match the local
  /// moon-sighting authority. Display only — never affects salah times.
  final int hijriAdjustmentDays;

  /// Arabic typeface for Quran verse text. Display only.
  final QuranFontOption quranFont;

  const PrayerSettings({
    this.latitude,
    this.longitude,
    this.locationLabel,
    this.locationSource = LocationSource.device,
    this.timezone,
    this.calculationMethod = CalculationMethodOption.isna,
    this.asrMethod = AsrMethod.standard,
    this.highLatitudeRule = HighLatitudeRuleOption.middleOfTheNight,
    this.customFajrAngle = 18.0,
    this.customIshaAngle = 17.0,
    this.manualAdjustments = const {},
    this.notificationsEnabled = true,
    this.callScreenEnabled = true,
    this.duhaReminderEnabled = false,
    this.qiyamReminderEnabled = false,
    this.duaReminderEnabled = false,
    this.duaWindows = const [DuaWindow.beforeMaghrib],
    this.duaCardSeconds = 30,
    this.snoozeMinutes = 10,
    this.hijriAdjustmentDays = 0,
    this.quranFont = QuranFontOption.notoNaskhArabic,
  });

  bool get hasLocation => latitude != null && longitude != null;

  int adjustmentFor(SalahPrayer prayer) => manualAdjustments[prayer] ?? 0;

  PrayerSettings copyWith({
    double? latitude,
    double? longitude,
    String? locationLabel,
    LocationSource? locationSource,
    String? timezone,
    CalculationMethodOption? calculationMethod,
    AsrMethod? asrMethod,
    HighLatitudeRuleOption? highLatitudeRule,
    double? customFajrAngle,
    double? customIshaAngle,
    Map<SalahPrayer, int>? manualAdjustments,
    bool? notificationsEnabled,
    bool? callScreenEnabled,
    bool? duhaReminderEnabled,
    bool? qiyamReminderEnabled,
    bool? duaReminderEnabled,
    List<DuaWindow>? duaWindows,
    int? duaCardSeconds,
    int? snoozeMinutes,
    int? hijriAdjustmentDays,
    QuranFontOption? quranFont,
  }) {
    return PrayerSettings(
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      locationLabel: locationLabel ?? this.locationLabel,
      locationSource: locationSource ?? this.locationSource,
      timezone: timezone ?? this.timezone,
      calculationMethod: calculationMethod ?? this.calculationMethod,
      asrMethod: asrMethod ?? this.asrMethod,
      highLatitudeRule: highLatitudeRule ?? this.highLatitudeRule,
      customFajrAngle: customFajrAngle ?? this.customFajrAngle,
      customIshaAngle: customIshaAngle ?? this.customIshaAngle,
      manualAdjustments: manualAdjustments ?? this.manualAdjustments,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      callScreenEnabled: callScreenEnabled ?? this.callScreenEnabled,
      duhaReminderEnabled: duhaReminderEnabled ?? this.duhaReminderEnabled,
      qiyamReminderEnabled: qiyamReminderEnabled ?? this.qiyamReminderEnabled,
      duaReminderEnabled: duaReminderEnabled ?? this.duaReminderEnabled,
      duaWindows: duaWindows ?? this.duaWindows,
      duaCardSeconds: duaCardSeconds ?? this.duaCardSeconds,
      snoozeMinutes: snoozeMinutes ?? this.snoozeMinutes,
      hijriAdjustmentDays: hijriAdjustmentDays ?? this.hijriAdjustmentDays,
      quranFont: quranFont ?? this.quranFont,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'locationLabel': locationLabel,
      'locationSource': locationSource.name,
      'timezone': timezone,
      'calculationMethod': calculationMethod.name,
      'asrMethod': asrMethod.name,
      'highLatitudeRule': highLatitudeRule.name,
      'customFajrAngle': customFajrAngle,
      'customIshaAngle': customIshaAngle,
      'manualAdjustments': manualAdjustments.map(
        (prayer, minutes) => MapEntry(prayer.name, minutes),
      ),
      'notificationsEnabled': notificationsEnabled,
      'callScreenEnabled': callScreenEnabled,
      'duhaReminderEnabled': duhaReminderEnabled,
      'qiyamReminderEnabled': qiyamReminderEnabled,
      'duaReminderEnabled': duaReminderEnabled,
      'duaWindows': duaWindows.map((w) => w.name).toList(),
      'duaCardSeconds': duaCardSeconds,
      'snoozeMinutes': snoozeMinutes,
      'hijriAdjustmentDays': hijriAdjustmentDays,
      'quranFont': quranFont.name,
    };
  }

  factory PrayerSettings.fromJson(Map<String, dynamic> json) {
    final rawAdjustments =
        (json['manualAdjustments'] as Map?)?.cast<String, dynamic>() ?? {};
    final adjustments = <SalahPrayer, int>{};
    for (final entry in rawAdjustments.entries) {
      final prayer = SalahPrayer.fromName(entry.key);
      if (prayer != null) {
        adjustments[prayer] = (entry.value as num).toInt();
      }
    }

    T enumByName<T extends Enum>(List<T> values, Object? name, T fallback) {
      if (name is! String) return fallback;
      for (final v in values) {
        if (v.name == name) return v;
      }
      return fallback;
    }

    return PrayerSettings(
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      locationLabel: json['locationLabel'] as String?,
      locationSource: enumByName(
        LocationSource.values,
        json['locationSource'],
        LocationSource.device,
      ),
      timezone: json['timezone'] as String?,
      calculationMethod: enumByName(
        CalculationMethodOption.values,
        json['calculationMethod'],
        CalculationMethodOption.isna,
      ),
      asrMethod: enumByName(
        AsrMethod.values,
        json['asrMethod'],
        AsrMethod.standard,
      ),
      highLatitudeRule: enumByName(
        HighLatitudeRuleOption.values,
        json['highLatitudeRule'],
        HighLatitudeRuleOption.middleOfTheNight,
      ),
      customFajrAngle: (json['customFajrAngle'] as num?)?.toDouble() ?? 18.0,
      customIshaAngle: (json['customIshaAngle'] as num?)?.toDouble() ?? 17.0,
      manualAdjustments: adjustments,
      notificationsEnabled: json['notificationsEnabled'] as bool? ?? true,
      // Note: a legacy 'reminderStyle' key may exist in stored settings from
      // older builds; it is intentionally ignored.
      callScreenEnabled: json['callScreenEnabled'] as bool? ?? true,
      duhaReminderEnabled: json['duhaReminderEnabled'] as bool? ?? false,
      qiyamReminderEnabled: json['qiyamReminderEnabled'] as bool? ?? false,
      duaReminderEnabled: json['duaReminderEnabled'] as bool? ?? false,
      duaWindows: () {
        final parsed = <DuaWindow>[
          for (final n in (json['duaWindows'] as List?) ?? const [])
            if (DuaWindow.fromName(n as String?) != null)
              DuaWindow.fromName(n)!,
        ];
        return parsed.isEmpty ? const [DuaWindow.beforeMaghrib] : parsed;
      }(),
      duaCardSeconds:
          (json['duaCardSeconds'] as num?)?.toInt() == 60 ? 60 : 30,
      snoozeMinutes: (json['snoozeMinutes'] as num?)?.toInt() ?? 10,
      hijriAdjustmentDays: ((json['hijriAdjustmentDays'] as num?)?.toInt() ?? 0)
          .clamp(-2, 2),
      quranFont: enumByName(
        QuranFontOption.values,
        json['quranFont'],
        QuranFontOption.notoNaskhArabic,
      ),
    );
  }

  /// Default calculation method for new users. ISNA is the app default;
  /// users can switch to other Sunni methods in Settings.
  static CalculationMethodOption suggestMethodForTimezone(String? timezone) {
    return CalculationMethodOption.isna;
  }
}
