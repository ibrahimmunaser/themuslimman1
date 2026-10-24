class CourseLangOption {
  final String code;
  final String label;
  final bool rtl;
  const CourseLangOption(this.code, this.label, {this.rtl = false});
}

/// Same course languages as the website, in the same order.
const kCourseLangOptions = <CourseLangOption>[
  CourseLangOption('en', 'English'),
  CourseLangOption('ar', 'العربية', rtl: true),
  CourseLangOption('fr', 'Français'),
  CourseLangOption('id', 'Bahasa Indonesia'),
  CourseLangOption('ms', 'Bahasa Melayu'),
  CourseLangOption('zh', '中文'),
  CourseLangOption('ru', 'Русский'),
  CourseLangOption('sw', 'Kiswahili'),
  CourseLangOption('es', 'Español'),
  CourseLangOption('de', 'Deutsch'),
  CourseLangOption('tr', 'Türkçe'),
  CourseLangOption('hi', 'हिन्दी'),
  CourseLangOption('ur', 'اردو', rtl: true),
  CourseLangOption('bn', 'বাংলা'),
  CourseLangOption('fa', 'فارسی', rtl: true),
];

const kSupportedCourseLangs = {
  'en', 'ar', 'fr', 'id', 'ms', 'zh', 'ru', 'sw', 'es', 'de', 'tr', 'hi', 'ur', 'bn', 'fa',
};

bool isRtlCourseLang(String lang) =>
    kCourseLangOptions.any((o) => o.code == lang && o.rtl);

String courseLangLabel(String lang) {
  for (final option in kCourseLangOptions) {
    if (option.code == lang) return option.label;
  }
  return 'English';
}

/// Query suffix for content APIs. English is the default (no param).
String courseLangQuery(String lang) =>
    lang == 'en' || !kSupportedCourseLangs.contains(lang) ? '' : '?lang=$lang';
