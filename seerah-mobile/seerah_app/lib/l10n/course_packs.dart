import 'dart:convert';

import 'package:flutter/services.dart';

import 'course_numbers.dart';

/// Translations for the twelve course languages, plus French content that
/// the hand-written French UI map does not cover. Loaded for the active
/// language before the language switch is published to the UI.
class CoursePacks {
  static String loaded = '';
  static Map<String, String> ui = {};
  static Map<String, String> phrases = {};

  static Future<void> ensure(String lang) async {
    if (loaded == lang && (lang == 'en' || lang == 'ar' || ui.isNotEmpty || phrases.isNotEmpty)) {
      return;
    }
    if (lang == 'en' || lang == 'ar') {
      loaded = lang;
      ui = {};
      phrases = {};
      return;
    }
    try {
      final raw = await rootBundle.loadString('assets/i18n/$lang.json');
      final json = jsonDecode(raw) as Map<String, dynamic>;
      ui = _stringMap(json['ui']);
      phrases = _stringMap(json['phrases']);
    } catch (_) {
      ui = {};
      phrases = {};
    }
    loaded = lang;
  }

  static Map<String, String> _stringMap(dynamic raw) {
    if (raw is! Map) return {};
    return raw.map((k, v) => MapEntry(k.toString(), v?.toString() ?? ''));
  }

  /// English source text in [lang]. Arabic callers pass their own Arabic
  /// field. English is returned unchanged.
  static String phrase(String lang, String en) {
    if (lang == 'en' || lang == 'ar' || en.isEmpty) return en;
    if (loaded != lang) return localizeNumerals(lang, en);
    final hit = phrases[en];
    final text = (hit == null || hit.isEmpty) ? en : hit;
    return localizeNumerals(lang, text);
  }

  static String? uiString(String lang, String key) {
    if (loaded != lang) return null;
    final hit = ui[key];
    if (hit == null || hit.isEmpty) return null;
    return hit;
  }
}

/// Arabic field when the course language is Arabic, otherwise the
/// translated English source.
String locField(String lang, String en, String ar) {
  if (lang == 'ar' && ar.isNotEmpty) return ar;
  return CoursePacks.phrase(lang, en);
}
