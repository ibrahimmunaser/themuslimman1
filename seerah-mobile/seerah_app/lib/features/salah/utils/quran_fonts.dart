import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../models/prayer_settings.dart';
import '../state/app_controller.dart';

/// Applies the user's chosen [QuranFontOption] to [base], keeping every
/// other property (color, size, weight, height, letter spacing, ...) from
/// [base] unchanged. Use this for all Quran verse / Bismillah text so the
/// font picker (see [showQuranFontPicker]) actually takes effect.
TextStyle quranTextStyle(QuranFontOption font, TextStyle base) {
  switch (font) {
    case QuranFontOption.amiriQuran:
      // Not GoogleFonts.amiriQuran(): upstream ships the COLR/CPAL-colored
      // AmiriQuranColored.ttf, which bakes its diacritic/ayah-marker colors
      // directly into the font's palette table, ignoring TextStyle.color.
      // "Amiri Quran Gold" is a locally bundled copy with that palette
      // patched to this app's gold instead of the original red/green — see
      // assets/fonts/AmiriQuranGold.ttf and the pubspec `fonts:` entry.
      return base.copyWith(fontFamily: 'Amiri Quran Gold');
    case QuranFontOption.scheherazadeNew:
      return GoogleFonts.scheherazadeNew(textStyle: base);
    case QuranFontOption.lateef:
      return GoogleFonts.lateef(textStyle: base);
    case QuranFontOption.notoNaskhArabic:
      return GoogleFonts.notoNaskhArabic(textStyle: base);
  }
}

/// Bottom sheet for picking the Quran font, with a live Arabic preview of
/// each option. Reused by the quick font button on the Quran reader
/// screens themselves (the main discoverable entry point) and by the
/// Settings > Display > "Quran Font" row.
Future<void> showQuranFontPicker(BuildContext context) async {
  final controller = context.read<AppController>();
  final current = controller.settings.quranFont;

  final choice = await showModalBottomSheet<QuranFontOption>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (sheetContext) {
      return SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: Text(
                'Quran Font',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ),
            RadioGroup<QuranFontOption>(
              groupValue: current,
              onChanged: (value) => Navigator.of(sheetContext).pop(value),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children:
                    QuranFontOption.values
                        .map(
                          (v) => RadioListTile<QuranFontOption>(
                            value: v,
                            title: Text(v.displayName),
                            subtitle: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(child: Text(v.description)),
                                const SizedBox(width: 8),
                                Text(
                                  '\u0628\u0650\u0633\u0652\u0645\u0650',
                                  textDirection: TextDirection.rtl,
                                  style: quranTextStyle(
                                    v,
                                    const TextStyle(fontSize: 20),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                        .toList(),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      );
    },
  );

  if (choice != null && choice != current) {
    await controller.updateSettings(
      controller.settings.copyWith(quranFont: choice),
    );
  }
}
