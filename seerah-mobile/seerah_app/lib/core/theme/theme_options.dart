import 'package:flutter/material.dart';

/// One selectable app theme. Only 4 colors are hand-picked per theme — page
/// background, cards/navigation, accent, main text — everything else
/// (secondary/muted text, borders, accent shades, on-accent text, status
/// bar brightness) is derived from these by [AppColors.applyTheme].
class AppThemeOption {
  /// Stable id, persisted to SharedPreferences.
  final String id;

  /// Localization key for the display name (see app_strings.dart).
  final String labelKey;

  final Color background;
  final Color cardNav;
  final Color accent;
  final Color mainText;

  const AppThemeOption({
    required this.id,
    required this.labelKey,
    required this.background,
    required this.cardNav,
    required this.accent,
    required this.mainText,
  });
}

/// All 8 themes, in the order they're offered on the Account screen.
/// Black & Gold is the original/default look; the other 7 are the palette
/// the user specified (page background / cards‑nav / accent / main text).
const kAppThemeOptions = <AppThemeOption>[
  AppThemeOption(
    id: 'blackGold',
    labelKey: 'themeBlackGold',
    background: Color(0xFF0A0A0A),
    cardNav: Color(0xFF1C1C1C),
    accent: Color(0xFFD4A017),
    mainText: Color(0xFFFFFFFF),
  ),
  AppThemeOption(
    id: 'emeraldNight',
    labelKey: 'themeEmeraldNight',
    background: Color(0xFF071A14),
    cardNav: Color(0xFF102A21),
    accent: Color(0xFF6ED6A5),
    mainText: Color(0xFFF0F7F2),
  ),
  AppThemeOption(
    id: 'midnightBlue',
    labelKey: 'themeMidnightBlue',
    background: Color(0xFF080F20),
    cardNav: Color(0xFF14213A),
    accent: Color(0xFF80B8FF),
    mainText: Color(0xFFF2F6FF),
  ),
  AppThemeOption(
    id: 'royalPlum',
    labelKey: 'themeRoyalPlum',
    background: Color(0xFF180F20),
    cardNav: Color(0xFF2B1C35),
    accent: Color(0xFFC5A3E8),
    mainText: Color(0xFFF8F1FC),
  ),
  AppThemeOption(
    id: 'warmMocha',
    labelKey: 'themeWarmMocha',
    background: Color(0xFF191411),
    cardNav: Color(0xFF2B231D),
    accent: Color(0xFFD9B38C),
    mainText: Color(0xFFFAF3EA),
  ),
  AppThemeOption(
    id: 'ivoryForest',
    labelKey: 'themeIvoryForest',
    background: Color(0xFFF7F4EB),
    cardNav: Color(0xFFEAE7DC),
    accent: Color(0xFF245741),
    mainText: Color(0xFF202D25),
  ),
  AppThemeOption(
    id: 'softSage',
    labelKey: 'themeSoftSage',
    background: Color(0xFFF0F4EE),
    cardNav: Color(0xFFE1E9DE),
    accent: Color(0xFF42634B),
    mainText: Color(0xFF243429),
  ),
  AppThemeOption(
    id: 'sandTerracotta',
    labelKey: 'themeSandTerracotta',
    background: Color(0xFFFAF2E8),
    cardNav: Color(0xFFEFE1D0),
    accent: Color(0xFF9C4934),
    mainText: Color(0xFF392A23),
  ),
  AppThemeOption(
    id: 'obsidianSilver',
    labelKey: 'themeObsidianSilver',
    background: Color(0xFF101113),
    cardNav: Color(0xFF202226),
    accent: Color(0xFFC5CAD3),
    mainText: Color(0xFFF5F5F7),
  ),
  AppThemeOption(
    id: 'oceanTeal',
    labelKey: 'themeOceanTeal',
    background: Color(0xFF071C22),
    cardNav: Color(0xFF102F36),
    accent: Color(0xFF66D4D0),
    mainText: Color(0xFFEFFBFA),
  ),
  AppThemeOption(
    id: 'burgundyRose',
    labelKey: 'themeBurgundyRose',
    background: Color(0xFF210F16),
    cardNav: Color(0xFF361C26),
    accent: Color(0xFFE5A0B4),
    mainText: Color(0xFFFFF2F5),
  ),
  AppThemeOption(
    id: 'pearlSapphire',
    labelKey: 'themePearlSapphire',
    background: Color(0xFFF3F6FC),
    cardNav: Color(0xFFE5EBF5),
    accent: Color(0xFF315BA8),
    mainText: Color(0xFF1C2940),
  ),
  AppThemeOption(
    id: 'blushRosewood',
    labelKey: 'themeBlushRosewood',
    background: Color(0xFFFCF3F5),
    cardNav: Color(0xFFF2E2E7),
    accent: Color(0xFF984C65),
    mainText: Color(0xFF412B34),
  ),
  AppThemeOption(
    id: 'oliveLinen',
    labelKey: 'themeOliveLinen',
    background: Color(0xFFF5F3E8),
    cardNav: Color(0xFFE8E5D3),
    accent: Color(0xFF626B35),
    mainText: Color(0xFF303422),
  ),
];

AppThemeOption themeById(String id) =>
    kAppThemeOptions.firstWhere((t) => t.id == id, orElse: () => kAppThemeOptions.first);
