import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter/services.dart' show rootBundle;

/// Rotating "Did you know / Miracles / Prophecies" cards, mirroring the
/// website widgets: all three fade out together, swap to a new random
/// entry, and fade back in every [_displayDuration].
const _displayDuration = Duration(seconds: 15);
const _fadeDuration = Duration(milliseconds: 600);

class _Entry {
  const _Entry(this.text, this.extra, this.tag, this.ref);
  final String text;
  final String extra; // prophecy fulfillment
  final String tag; // category / type
  final String ref;
}

class ProphetFactsSection extends StatefulWidget {
  const ProphetFactsSection({super.key, required this.lang});
  final String lang;

  @override
  State<ProphetFactsSection> createState() => _ProphetFactsSectionState();
}

class _ProphetFactsSectionState extends State<ProphetFactsSection> {
  final _rand = Random();
  Map<String, List<_Entry>> _data = {};
  Map<String, int> _index = {'facts': 0, 'miracles': 0, 'prophecies': 0};
  bool _visible = true;
  Timer? _timer;
  String _loadedLang = '';
  Map<String, String> _ph = {};

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(_displayDuration, (_) => _cycle());
  }

  @override
  void didUpdateWidget(covariant ProphetFactsSection old) {
    super.didUpdateWidget(old);
    if (old.lang != widget.lang) _load();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String get _suffix =>
      (widget.lang == 'ar' || widget.lang == 'fr') ? '-${widget.lang}' : '';

  static String _ref(String r) => r
      .replaceAll('Sahih al-Bukhari and Sahih Muslim', 'Bukhari & Muslim')
      .replaceAll('Sahih al-Bukhari; Sahih Muslim', 'Bukhari & Muslim')
      .replaceAll('Sahih al-Bukhari', 'Bukhari')
      .replaceAll('Sahih Muslim', 'Muslim')
      .replaceAll('Sunan Abi Dawud', 'Abu Dawud')
      .trim();

  Future<void> _load() async {
    final lang = widget.lang;
    var ph = <String, String>{};
    if (lang != 'en' && lang != 'ar' && lang != 'fr') {
      try {
        final raw = await rootBundle.loadString('assets/facts/i18n/$lang.json');
        ph = (jsonDecode(raw) as Map).cast<String, String>();
      } catch (_) {}
    }
    String x(String s) => ph[s] ?? s;
    final out = <String, List<_Entry>>{};
    for (final n in ['facts', 'miracles', 'prophecies']) {
      final raw = await rootBundle.loadString('assets/facts/$n$_suffix.json');
      final list = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      out[n] = list.map((m) {
        switch (n) {
          case 'facts':
            return _Entry(x('${m['clean_fact'] ?? ''}'), '',
                x('${m['category'] ?? ''}'), _ref('${m['reference'] ?? ''}'));
          case 'miracles':
            return _Entry(x('${m['fact'] ?? ''}'), '',
                x('${m['type'] ?? ''}'), _ref('${m['reference'] ?? ''}'));
          default:
            return _Entry(x('${m['fact'] ?? ''}'),
                x('${m['fulfillment'] ?? ''}'), '', _ref('${m['reference'] ?? ''}'));
        }
      }).toList();
    }
    if (!mounted) return;
    setState(() {
      _ph = ph;
      _data = out;
      _loadedLang = lang;
      _index = {
        for (final e in out.entries) e.key: _rand.nextInt(max(1, e.value.length)),
      };
    });
  }

  Future<void> _cycle() async {
    if (!mounted || _data.isEmpty) return;
    setState(() => _visible = false);
    await Future.delayed(_fadeDuration);
    if (!mounted) return;
    setState(() {
      for (final e in _data.entries) {
        if (e.value.length < 2) continue;
        var i = _index[e.key] ?? 0;
        while (i == _index[e.key]) {
          i = _rand.nextInt(e.value.length);
        }
        _index[e.key] = i;
      }
      _visible = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_data.isEmpty || _loadedLang.isEmpty) return const SizedBox.shrink();
    final isAr = widget.lang == 'ar';
    final isFr = widget.lang == 'fr';
    final isRtl = isAr || widget.lang == 'ur' || widget.lang == 'fa';
    String tr(String en, String ar, String fr) {
      if (isAr) return ar;
      if (isFr) return fr;
      final base = en.endsWith('?') ? en : en;
      final key = {
        'DID YOU KNOW?': 'Did You Know?',
        'MIRACLES OF THE PROPHET ﷺ': 'Miracles of the Prophet ﷺ',
        'PROPHECIES OF THE PROPHET ﷺ': 'Prophecies of the Prophet ﷺ',
      }[base];
      final translated = key == null ? null : _ph[key];
      return (translated ?? base).toUpperCase();
    }

    Widget card({
      required String key,
      required String title,
      required Color accent,
      required Color bg,
      required Color text,
      required Color sub,
    }) {
      final list = _data[key]!;
      final e = list[(_index[key] ?? 0).clamp(0, list.length - 1)];
      return _FactCard(
        title: title,
        accent: accent,
        bg: bg,
        textColor: text,
        subColor: sub,
        entry: e,
        visible: _visible,
        rtl: isRtl,
      );
    }

    return Column(
      children: [
        card(
          key: 'facts',
          title: tr('DID YOU KNOW?', 'هل تعلم؟', 'LE SAVIEZ-VOUS ?'),
          accent: const Color(0xFFD4A017),
          bg: const Color(0xFF1A1409),
          text: const Color(0xFFE8E4F0),
          sub: const Color(0xFF9E9AAC),
        ),
        const SizedBox(height: 12),
        card(
          key: 'miracles',
          title: tr('MIRACLES OF THE PROPHET ﷺ', 'معجزات النبي ﷺ',
              'MIRACLES DU PROPHÈTE ﷺ'),
          accent: const Color(0xFF7DD3FC),
          bg: const Color(0xFF0A1520),
          text: const Color(0xFFC8E4F8),
          sub: const Color(0xFF7AAAC4),
        ),
        const SizedBox(height: 12),
        card(
          key: 'prophecies',
          title: tr('PROPHECIES OF THE PROPHET ﷺ', 'نبوءات النبي ﷺ',
              'PROPHÉTIES DU PROPHÈTE ﷺ'),
          accent: const Color(0xFF6EE7B7),
          bg: const Color(0xFF0A1A10),
          text: const Color(0xFFC8F0DA),
          sub: const Color(0xFF7ABFA0),
        ),
      ],
    );
  }
}

class _FactCard extends StatelessWidget {
  const _FactCard({
    required this.title,
    required this.accent,
    required this.bg,
    required this.textColor,
    required this.subColor,
    required this.entry,
    required this.visible,
    required this.rtl,
  });

  final String title;
  final Color accent;
  final Color bg;
  final Color textColor;
  final Color subColor;
  final _Entry entry;
  final bool visible;
  final bool rtl;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: accent.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('✦', style: TextStyle(color: accent, fontSize: 14)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    color: accent,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.4,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          AnimatedOpacity(
            opacity: visible ? 1 : 0,
            duration: _fadeDuration,
            curve: Curves.easeInOut,
            child: Directionality(
              textDirection: rtl ? TextDirection.rtl : TextDirection.ltr,
              child: SizedBox(
                width: double.infinity,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(entry.text,
                        style: TextStyle(
                            color: textColor, fontSize: 13, height: 1.45)),
                    if (entry.extra.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(entry.extra,
                          style: TextStyle(
                              color: subColor,
                              fontSize: 13,
                              height: 1.45,
                              fontStyle: FontStyle.italic)),
                    ],
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        if (entry.tag.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: accent.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(5),
                              border: Border.all(
                                  color: accent.withValues(alpha: 0.3)),
                            ),
                            child: Text(entry.tag,
                                style: TextStyle(
                                    color: accent,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600)),
                          ),
                        if (entry.ref.isNotEmpty)
                          Text('· ${entry.ref}',
                              style: TextStyle(color: subColor, fontSize: 10)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
