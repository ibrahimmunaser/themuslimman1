import 'package:flutter/material.dart';

class AppColors {
  // Base
  static const background = Color(0xFF0A0A0A);
  static const surface = Color(0xFF141414);
  static const card = Color(0xFF1C1C1C);
  static const border = Color(0xFF2A2A2A);

  // Gold
  static const gold = Color(0xFFD4A017);
  static const goldDark = Color(0xFFB8860B);
  static const goldLight = Color(0xFFE8C040);
  static const goldFaded = Color(0x33D4A017);

  // Text
  static const textPrimary = Color(0xFFFFFFFF);
  static const textSecondary = Color(0xFF9A9A9A);
  static const textMuted = Color(0xFF5A5A5A);

  // Surfaces
  static const surfaceRaised = Color(0xFF1A1A1A);

  // Gradients
  static const backgroundGradient = RadialGradient(
    center: Alignment(0, -0.5),
    radius: 1.3,
    colors: [Color(0xFF141008), background],
  );

  // Status
  static const success = Color(0xFF4CAF50);
  static const error = Color(0xFFEF5350);
  static const warning = Color(0xFFFFA726);

  // Era colors (colorA)
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
}
