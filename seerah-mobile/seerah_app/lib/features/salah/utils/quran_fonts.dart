import 'package:flutter/widgets.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/prayer_settings.dart';

/// Applies the user's chosen [QuranFontOption] to [base], keeping every
/// other property (color, size, weight, height, letter spacing, ...) from
/// [base] unchanged. Use this for all Quran verse / Bismillah text so the
/// Settings > Display > "Quran Font" picker actually takes effect.
TextStyle quranTextStyle(QuranFontOption font, TextStyle base) {
  switch (font) {
    case QuranFontOption.amiriQuran:
      return GoogleFonts.amiriQuran(textStyle: base);
    case QuranFontOption.scheherazadeNew:
      return GoogleFonts.scheherazadeNew(textStyle: base);
    case QuranFontOption.lateef:
      return GoogleFonts.lateef(textStyle: base);
    case QuranFontOption.notoNaskhArabic:
      return GoogleFonts.notoNaskhArabic(textStyle: base);
  }
}
