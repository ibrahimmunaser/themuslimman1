import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

import 'tafsir_translator.dart';

/// Provides per-verse tafsir (commentary).
///
/// Lookup order:
///  1. Locally bundled asset: assets/tafsir/surah_XXX/verse_YYY.txt
///     (instant, offline; one small file per verse, folders per surah).
///  2. Previously downloaded copy cached on disk.
///  3. Network: abridged Tafsir Ibn Kathir (English) from the open
///     spa5k/tafsir_api dataset, then cached for offline reuse.
class TafsirService {
  TafsirService._();

  static final TafsirService instance = TafsirService._();

  static const _networkBase =
      'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/en-tafisr-ibn-kathir';

  final Map<String, String> _memory = {};

  String _assetPath(int surah, int verse) =>
      'assets/tafsir/surah_${surah.toString().padLeft(3, '0')}/verse_${verse.toString().padLeft(3, '0')}.txt';

  Future<File> _cacheFile(int surah, int verse, [String prefix = '']) async {
    final docs = await getApplicationDocumentsDirectory();
    final dir = Directory('${docs.path}/tafsir_cache');
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    return File('${dir.path}/$prefix${surah}_$verse.txt');
  }

  /// Returns tafsir text for a verse, or null if unavailable.
  Future<String?> getTafsir(int surah, int verse, [String lang = 'en']) async {
    if (lang != 'en') {
      final native = await _getNative(surah, verse, lang);
      if (native != null) return native;
    }
    final english = await _getEnglish(surah, verse);
    if (english == null || lang == 'en') return english;
    return TafsirTranslator.instance.translate(
      english,
      lang,
      cacheFile: await _cacheFile(surah, verse, 'tr_${lang}_'),
    );
  }

  /// Real tafsir editions that exist in the dataset for some languages —
  /// fetched directly from the CDN, same as English, with no on-device
  /// translation step. Far faster than [TafsirTranslator] (which has to
  /// download ~30MB ML Kit models per language on first use and then
  /// translate chunk-by-chunk) and higher quality, since it's real scholarly
  /// commentary written in that language rather than a machine translation
  /// of the English Ibn Kathir text.
  static const _nativeEditions = {
    'ar': 'ar-tafsir-ibn-kathir',
    'ur': 'ur-tafseer-ibn-e-kaseer',
    'ru': 'ru-tafsir-ibne-kahtir',
    'tr': 'tr-tafsir-ibne-kathir',
    'bn': 'bn-tafseer-ibn-e-kaseer',
    'fr': 'french-mokhtasar',
    'es': 'spanish-mokhtasar',
    'fa': 'persian-mokhtasar',
    'id': 'indonesian-mokhtasar',
    'hi': 'hindi-mokhtasar',
    'zh': 'chinese-mokhtasar',
  };

  /// True for a language with no real tafsir edition in the dataset, i.e.
  /// one that still has to go through [TafsirTranslator]'s on-device ML
  /// Kit translation of the English text. Lets callers (e.g. the language
  /// picker) prewarm just these languages' translation models in the
  /// background, instead of guessing/duplicating this list elsewhere.
  static bool needsOnDeviceTranslation(String lang) =>
      lang != 'en' && !_nativeEditions.containsKey(lang);

  Future<String?> _getNative(int surah, int verse, String lang) async {
    final edition = _nativeEditions[lang];
    if (edition == null) return null;
    final key = 'n$lang:$surah:$verse';
    final mem = _memory[key];
    if (mem != null) return mem;
    try {
      final cache = await _cacheFile(surah, verse, 'ik_${lang}_');
      if (await cache.exists()) {
        final t = (await cache.readAsString()).trim();
        if (t.isNotEmpty) return _memory[key] = t;
      }
      final response = await http
          .get(Uri.parse(
              'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/$edition/$surah/$verse.json'))
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        final text = _stripHtml((decoded['text'] as String? ?? '').trim());
        if (text.length > 80) {
          try {
            await cache.writeAsString(text);
          } catch (_) {}
          return _memory[key] = text;
        }
      }
    } catch (_) {}
    return null;
  }

  Future<String?> _getEnglish(int surah, int verse) async {
    final memoryKey = '$surah:$verse';
    final memory = _memory[memoryKey];
    if (memory != null) return memory;

    // 1. Bundled asset.
    try {
      final text = await rootBundle.loadString(_assetPath(surah, verse));
      final trimmed = text.trim();
      if (trimmed.isNotEmpty) {
        _memory[memoryKey] = trimmed;
        return trimmed;
      }
    } catch (_) {
      // Asset not bundled for this verse; fall through.
    }

    // 2. Disk cache from a previous download.
    try {
      final cache = await _cacheFile(surah, verse);
      if (await cache.exists()) {
        final text = (await cache.readAsString()).trim();
        if (text.isNotEmpty) {
          _memory[memoryKey] = text;
          return text;
        }
      }
    } catch (_) {}

    // 3. Network fallback.
    try {
      final response = await http
          .get(Uri.parse('$_networkBase/$surah/$verse.json'))
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        final text = _stripHtml((decoded['text'] as String? ?? '').trim());
        if (text.isNotEmpty) {
          _memory[memoryKey] = text;
          try {
            await (await _cacheFile(surah, verse)).writeAsString(text);
          } catch (_) {}
          return text;
        }
      }
    } catch (_) {}

    return null;
  }

  String _stripHtml(String html) =>
      html
          .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
          .replaceAll(RegExp(r'</p>', caseSensitive: false), '\n\n')
          .replaceAll(RegExp(r'<[^>]+>'), '')
          .replaceAll('&nbsp;', ' ')
          .replaceAll('&amp;', '&')
          .replaceAll('&quot;', '"')
          .replaceAll('&#39;', "'")
          .replaceAll(RegExp(r'\n{3,}'), '\n\n')
          .trim();
}
