import 'package:flutter/material.dart';

import 'theme_options.dart';

/// App-wide chrome palette. These used to be `static const` (Black & Gold
/// only, baked in at compile time). They're now plain mutable statics so
/// [applyTheme] can repaint the whole app's chrome at runtime when the user
/// picks a theme on the Account screen — every one of the ~1000 existing
/// `AppColors.xxx` call sites across the app automatically follows, with no
/// need to touch each call site individually. See [AppThemeController] for
/// the Riverpod side (persistence + triggering a rebuild).
class AppColors {
  // Base — reassigned by [applyTheme]; defaults are Black & Gold.
  static Color background = const Color(0xFF0A0A0A);
  static Color surface = const Color(0xFF141414);
  static Color card = const Color(0xFF1C1C1C);
  static Color border = const Color(0xFF2A2A2A);
  static Color surfaceRaised = const Color(0xFF1A1A1A);

  // Accent ("gold" kept as the field name every screen already reads —
  // it's simply "this theme's accent color" now, not literally gold).
  static Color gold = const Color(0xFFD4A017);
  static Color goldDark = const Color(0xFFB8860B);
  static Color goldLight = const Color(0xFFE8C040);
  static Color goldFaded = const Color(0x33D4A017);

  /// Text/icon color to put on top of a solid [gold]-filled surface (e.g.
  /// the "Next" button) — black on a light accent, white on a dark one.
  static Color onGold = Colors.black;

  // Text
  static Color textPrimary = const Color(0xFFFFFFFF);
  static Color textSecondary = const Color(0xFF9A9A9A);
  static Color textMuted = const Color(0xFF808080);

  /// True for a dark-background theme (5 of the 8 themes); false for a
  /// light one (Ivory & Forest, Soft Sage, Sand & Terracotta). Drives
  /// status bar / system nav bar icon brightness.
  static bool isDark = true;

  // Gradient — a getter, not a stored const, since it embeds [background].
  static RadialGradient get backgroundGradient => RadialGradient(
    center: const Alignment(0, -0.5),
    radius: 1.3,
    colors: [Color.lerp(background, gold, 0.06) ?? background, background],
  );

  // Status — intentionally theme-invariant: these are universal semantic
  // signals (success/error/warning), not brand colors, so they stay
  // recognizable no matter which of the 8 themes is active.
  static const success = Color(0xFF4CAF50);
  static const error = Color(0xFFEF5350);
  static const warning = Color(0xFFFFA726);

  // Era colors (colorA) — Seerah timeline. Deliberately fixed per era,
  // regardless of the active chrome theme (see AppThemeController doc).
  static const eraPreIslamic = Color(0xFFA07840);
  static const eraBirthEarlyLife = Color(0xFF8A7AB0);
  static const eraEarlyRevelation = Color(0xFF4AA87E);
  static const eraMakkahPersecution = Color(0xFFC06060);
  static const eraHijrah = Color(0xFF5A90B0);
  static const eraMadinah = Color(0xFF6AAE50);
  static const eraCampaigns = Color(0xFFB08040);
  static const eraFinalYears = Color(0xFFD4AA60);

  static Color forEra(String era) {
    switch (era) {
      case 'pre-islamic': return eraPreIslamic;
      case 'birth-early-life': return eraBirthEarlyLife;
      case 'early-revelation': return eraEarlyRevelation;
      case 'makkah-persecution': return eraMakkahPersecution;
      case 'hijrah': return eraHijrah;
      case 'madinah': return eraMadinah;
      case 'campaigns': return eraCampaigns;
      case 'final-years': return eraFinalYears;
      default: return gold;
    }
  }

  /// Repaints every chrome field above from a 4-color [AppThemeOption]
  /// (page background, cards/navigation, accent, main text — the only 4
  /// values each theme actually specifies). Everything else (secondary/
  /// muted text, borders, the lighter/darker accent shades, the
  /// on-accent text color, dark-vs-light status bar) is derived from
  /// those 4 with one consistent formula, so it looks right for all 8
  /// themes without per-theme tuning:
  ///  - secondary text = main text blended 30% toward the page background
  ///  - muted text = main text blended 50% toward the page background
  ///  - border = cards/nav blended 12% toward main text (a touch lighter
  ///    than the card on a dark theme; a touch darker on a light one)
  ///  - accent dark/light = accent blended 25% toward background/text
  ///  - on-accent text = black if the accent is light, white if it's dark
  ///  - isDark = estimated from the page background's own brightness
  static void applyTheme(AppThemeOption theme) {
    background = theme.background;
    surface = theme.cardNav;
    card = theme.cardNav;
    surfaceRaised = Color.lerp(theme.cardNav, theme.mainText, 0.05)!;
    border = Color.lerp(theme.cardNav, theme.mainText, 0.12)!;

    gold = theme.accent;
    goldDark = Color.lerp(theme.accent, theme.background, 0.25)!;
    goldLight = Color.lerp(theme.accent, theme.mainText, 0.25)!;
    goldFaded = theme.accent.withValues(alpha: 0.2);
    onGold = theme.accent.computeLuminance() > 0.5 ? Colors.black : Colors.white;

    textPrimary = theme.mainText;
    textSecondary = Color.lerp(theme.mainText, theme.background, 0.3)!;
    textMuted = Color.lerp(theme.mainText, theme.background, 0.5)!;

    isDark = ThemeData.estimateBrightnessForColor(theme.background) == Brightness.dark;
  }
}
