const _nativeDigits = <String, String>{
  'ar': '٠١٢٣٤٥٦٧٨٩',
  'fa': '۰۱۲۳۴۵۶۷۸۹',
  'ur': '۰۱۲۳۴۵۶۷۸۹',
  'bn': '০১২৩৪৫৬৭৮৯',
  'hi': '०१२३४५६७८९',
};

const _zhDigits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/// Spoken Chinese numerals for 0–9999. 10 is 十, 12 is 十二, 101 is 一百零一.
String toChineseNumber(int n) {
  if (n < 0 || n > 9999) return '$n';
  if (n < 10) return _zhDigits[n];
  if (n < 20) return n == 10 ? '十' : '十${_zhDigits[n % 10]}';
  if (n < 100) {
    final tens = n ~/ 10;
    final ones = n % 10;
    return '${_zhDigits[tens]}十${ones == 0 ? '' : _zhDigits[ones]}';
  }
  if (n < 1000) {
    final hundreds = n ~/ 100;
    final rest = n % 100;
    if (rest == 0) return '${_zhDigits[hundreds]}百';
    if (rest < 10) return '${_zhDigits[hundreds]}百零${_zhDigits[rest]}';
    return '${_zhDigits[hundreds]}百${toChineseNumber(rest)}';
  }
  final thousands = n ~/ 1000;
  final rest = n % 1000;
  if (rest == 0) return '${_zhDigits[thousands]}千';
  if (rest < 100) return '${_zhDigits[thousands]}千零${toChineseNumber(rest)}';
  return '${_zhDigits[thousands]}千${toChineseNumber(rest)}';
}

String formatCourseNumber(String lang, int n) {
  if (lang == 'zh') return toChineseNumber(n);
  final digits = _nativeDigits[lang];
  if (digits == null) return '$n';
  return '$n'.split('').map((c) {
    final i = c.codeUnitAt(0) - 48;
    if (i < 0 || i > 9) return c;
    return digits[i];
  }).join();
}

String localizeNumerals(String lang, String text) {
  if (lang == 'zh') {
    return text.replaceAllMapped(RegExp(r'\d+'), (m) {
      final n = int.tryParse(m.group(0)!);
      if (n == null || n > 9999) return m.group(0)!;
      return toChineseNumber(n);
    });
  }
  final digits = _nativeDigits[lang];
  if (digits == null) return text;
  return text.replaceAllMapped(RegExp(r'[0-9]'), (m) {
    return digits[m.group(0)!.codeUnitAt(0) - 48];
  });
}
