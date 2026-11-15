import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/part_provider.dart';
import '../../../l10n/quran_strings.dart';
import '../../../l10n/salah_phrases.dart';
import '../../../l10n/surah_names.dart';
import '../models/quran_models.dart';

/// Translates a Salah-page English phrase for the selected language.
String sl(BuildContext context, String en) =>
    translateSalah(quranLang(context), en);

/// Currently selected app language (read once; Quran pages are rebuilt
/// when the user returns to them after changing language).
String quranLang(BuildContext context) =>
    ProviderScope.containerOf(context, listen: false).read(courseLangProvider);

/// Localized Quran-page string for the selected language.
String qc(BuildContext context, String key, [Map<String, Object>? args]) =>
    tq(quranLang(context), key, args);

/// Surah title: Arabic name for Arabic, transliterated name otherwise.
String surahTitle(SurahMeta meta, String lang) {
  if (lang == 'ar' || lang == 'ur' || lang == 'fa') return meta.arabicName;
  final l = surahNames[lang];
  if (l != null && meta.number >= 1 && meta.number <= l.length) {
    return l[meta.number - 1];
  }
  return meta.englishName;
}

/// Localized surah name by number (for saved positions / quick chips).
String surahNameFor(int number, String lang, String fallback) {
  final all = SurahMeta.all;
  if (number >= 1 && number <= all.length) return surahTitle(all[number - 1], lang);
  final l = surahNames[lang];
  if (l != null && number >= 1 && number <= l.length) return l[number - 1];
  return fallback;
}

/// Surah meaning line (only available in English from the API).
String surahMeaning(SurahMeta meta, String lang) =>
    lang == 'en' ? meta.englishTranslation : '';

/// Meccan / Medinan label.
String revelationLabel(String lang, String type) {
  const m = {
    'ar': ['مكية', 'مدنية'], 'fr': ['Mecquoise', 'Médinoise'],
    'es': ['Mecana', 'Medinense'], 'de': ['Mekkanisch', 'Medinensisch'],
    'tr': ['Mekki', 'Medeni'], 'ur': ['مکی', 'مدنی'], 'id': ['Makkiyah', 'Madaniyah'],
    'ms': ['Makkiyah', 'Madaniyah'], 'hi': ['मक्की', 'मदनी'], 'bn': ['মাক্কী', 'মাদানী'],
    'fa': ['مکی', 'مدنی'], 'ru': ['Мекканская', 'Мединская'],
    'zh': ['麦加章', '麦地那章'], 'sw': ['Ya Makka', 'Ya Madina'],
  };
  final l = m[lang];
  if (l == null) return type;
  return type.toLowerCase().startsWith('med') ? l[1] : l[0];
}
