import 'package:flutter/material.dart' hide Text;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/part_provider.dart';
import '../../../core/widgets/localized_text.dart';
import '../../../l10n/course_numbers.dart';
import '../services/tafsir_translator.dart';

/// Shows a saved place name (e.g. "Dearborn, Michigan, United States") in the
/// selected language. Shows the original immediately and swaps in the
/// on-device translation when it is ready.
class PlaceText extends ConsumerStatefulWidget {
  const PlaceText(this.text, {super.key, this.style, this.textAlign});

  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;

  @override
  ConsumerState<PlaceText> createState() => _PlaceTextState();
}

class _PlaceTextState extends ConsumerState<PlaceText> {
  String? _translated;
  String _forLang = 'en';
  String _forText = '';

  void _load(String lang) {
    _forLang = lang;
    _forText = widget.text;
    _translated = null;
    if (lang == 'en') return;
    TafsirTranslator.instance.translatePlace(widget.text, lang).then((t) {
      if (mounted && _forLang == lang && _forText == widget.text) {
        setState(() => _translated = t);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(courseLangProvider);
    if (lang != _forLang || widget.text != _forText) _load(lang);
    final shown = _translated ?? widget.text;
    return Text(
      lang == 'zh' ? shown : localizeNumerals(lang, shown),
      style: widget.style,
      textAlign: widget.textAlign,
    );
  }
}
