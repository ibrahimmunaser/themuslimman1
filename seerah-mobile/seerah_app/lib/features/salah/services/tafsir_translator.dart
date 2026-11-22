import 'dart:io';

import 'package:google_mlkit_translation/google_mlkit_translation.dart';

/// Translates the English tafsir text into the app language on-device
/// (Google ML Kit). The language model (~30 MB) downloads once per language;
/// after that translation works offline, and every translated verse is cached
/// on disk.
class TafsirTranslator {
  TafsirTranslator._();
  static final TafsirTranslator instance = TafsirTranslator._();

  static const _langs = <String, TranslateLanguage>{
    'ar': TranslateLanguage.arabic,
    'fr': TranslateLanguage.french,
    'es': TranslateLanguage.spanish,
    'de': TranslateLanguage.german,
    'tr': TranslateLanguage.turkish,
    'ur': TranslateLanguage.urdu,
    'id': TranslateLanguage.indonesian,
    'ms': TranslateLanguage.malay,
    'hi': TranslateLanguage.hindi,
    'bn': TranslateLanguage.bengali,
    'fa': TranslateLanguage.persian,
    'ru': TranslateLanguage.russian,
    'zh': TranslateLanguage.chinese,
    'sw': TranslateLanguage.swahili,
  };

  /// ML Kit is deliberately never touched on iOS. Its bundled telemetry
  /// uploader (MLKITx_CCTLogContext / CCTClearcutUploader) throws an
  /// uncaught `NSInvalidArgumentException` ("unrecognized selector
  /// hashForFilePath") on a background thread on current iOS versions
  /// (known upstream ML Kit bug), which kills the whole app natively — it
  /// can't be caught from Dart. Merely using the translator (even for a
  /// short place name on the Salah home screen) triggers it, so on iOS we
  /// skip on-device translation entirely and show the original text.
  static final bool _mlKitSupported = !Platform.isIOS;

  final _placeCache = <String, String>{};

  /// Short text (e.g. "Dearborn, Michigan, United States") translated into
  /// [lang]; falls back to the original on any failure. Results are cached
  /// in memory.
  Future<String> translatePlace(String text, String lang) async {
    if (!_mlKitSupported) return text;
    final target = _langs[lang];
    if (target == null || text.trim().isEmpty) return text;
    final key = '$lang|$text';
    final hit = _placeCache[key];
    if (hit != null) return hit;
    try {
      for (final code in [TranslateLanguage.english.bcpCode, target.bcpCode]) {
        if (!await _manager.isModelDownloaded(code)) {
          var ok = false;
          for (var i = 0; i < 3 && !ok; i++) {
            ok = await _manager.downloadModel(code, isWifiRequired: false);
          }
          if (!ok) return text;
        }
      }
      final translator = _translators.putIfAbsent(
        lang,
        () => OnDeviceTranslator(
          sourceLanguage: TranslateLanguage.english,
          targetLanguage: target,
        ),
      );
      final out = (await translator.translateText(text)).trim();
      if (out.isEmpty) return text;
      return _placeCache[key] = out;
    } catch (_) {
      return text;
    }
  }

  final _manager = OnDeviceTranslatorModelManager();
  final Map<String, OnDeviceTranslator> _translators = {};

  final Set<String> _prewarming = {};

  /// Kicks off the English + [lang] ML Kit model downloads in the
  /// background, without blocking the caller or throwing. Call this as soon
  /// as the user picks a language that still relies on on-device
  /// translation for tafsir (no real native edition exists for it — see
  /// TafsirService._nativeEditions), so the ~30MB-per-model download is
  /// already done (or well underway) by the time they actually open a
  /// verse's tafsir, instead of happening on the critical path of that tap.
  /// Safe to call repeatedly (e.g. every app start / every language
  /// switch) — downloadModel itself is a no-op if the model is already
  /// present, and [_prewarming] stops duplicate concurrent attempts for the
  /// same language within one app session.
  void prewarmModels(String lang) {
    if (!_mlKitSupported) return;
    final target = _langs[lang];
    if (target == null || !_prewarming.add(lang)) return;
    () async {
      try {
        for (final code in [TranslateLanguage.english.bcpCode, target.bcpCode]) {
          if (!await _manager.isModelDownloaded(code)) {
            await _manager.downloadModel(code, isWifiRequired: false);
          }
        }
      } catch (_) {
        // Best-effort only; _translate still retries/downloads normally if
        // this failed, just back on the critical path as before.
      } finally {
        _prewarming.remove(lang);
      }
    }();
  }

  Future<String?> translate(
    String english,
    String lang, {
    required File cacheFile,
  }) async {
    // iOS: no on-device translation (see [_mlKitSupported]); show the
    // English tafsir rather than nothing.
    if (!_mlKitSupported) return english;
    final target = _langs[lang];
    if (target == null) return english;
    try {
      if (await cacheFile.exists()) {
        final cached = (await cacheFile.readAsString()).trim();
        if (cached.isNotEmpty) return cached;
      }
    } catch (_) {}

    try {
      for (final code in [TranslateLanguage.english.bcpCode, target.bcpCode]) {
        if (!await _manager.isModelDownloaded(code)) {
          var ok = false;
          for (var i = 0; i < 4 && !ok; i++) {
            ok = await _manager.downloadModel(code, isWifiRequired: false);
            if (!ok) await Future<void>.delayed(const Duration(seconds: 2));
          }
          if (!ok) return null;
        }
      }
      final translator = _translators.putIfAbsent(
        lang,
        () => OnDeviceTranslator(
          sourceLanguage: TranslateLanguage.english,
          targetLanguage: target,
        ),
      );
      final out = <String>[];
      for (final paragraph in english.split(RegExp(r'\n\s*\n'))) {
        final p = paragraph.trim();
        if (p.isEmpty) continue;
        final parts = <String>[];
        for (final chunk in _chunks(p)) {
          parts.add((await translator.translateText(chunk)).trim());
        }
        out.add(parts.join(' '));
      }
      final result = out.join('\n\n').trim();
      if (result.isEmpty) return null;
      try {
        await cacheFile.writeAsString(result);
      } catch (_) {}
      return result;
    } catch (_) {
      return null;
    }
  }

  /// Splits long paragraphs at sentence boundaries to keep each model call
  /// short and accurate.
  Iterable<String> _chunks(String p) sync* {
    if (p.length <= 600) {
      yield p;
      return;
    }
    final sentences = p.split(RegExp(r'(?<=[.!?])\s+'));
    var buf = '';
    for (final s in sentences) {
      if (buf.isNotEmpty && buf.length + s.length > 600) {
        yield buf;
        buf = s;
      } else {
        buf = buf.isEmpty ? s : '$buf $s';
      }
    }
    if (buf.isNotEmpty) yield buf;
  }
}