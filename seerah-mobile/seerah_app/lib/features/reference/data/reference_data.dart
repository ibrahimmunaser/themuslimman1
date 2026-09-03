// Reference Library data — mirrors the web app's reference sections

import 'package:flutter/material.dart';

class ReferenceSection {
  final String id;
  final String title;
  final String titleAr;
  final String description;
  final String descriptionAr;
  const ReferenceSection({
    required this.id,
    required this.title,
    required this.titleAr,
    required this.description,
    required this.descriptionAr,
  });

  String localizedTitle(String lang) => lang == 'ar' ? titleAr : title;
  String localizedDescription(String lang) => lang == 'ar' ? descriptionAr : description;
}

IconData referenceSectionIcon(String id) {
  switch (id) {
    case 'family-household': return Icons.family_restroom_rounded;
    case 'timeline':         return Icons.timeline_rounded;
    case 'key-people':       return Icons.people_alt_rounded;
    case 'tribes-lineage':   return Icons.account_tree_rounded;
    case 'battles':          return Icons.shield_rounded;
    case 'miracles':         return Icons.auto_awesome_rounded;
    case 'important-terms':  return Icons.menu_book_rounded;
    case 'places-maps':      return Icons.map_rounded;
    default:                 return Icons.auto_stories_rounded;
  }
}

Color referenceSectionColor(String id) {
  switch (id) {
    case 'family-household': return const Color(0xFFB08040);
    case 'timeline':         return const Color(0xFF5A90B0);
    case 'key-people':       return const Color(0xFF4AA87E);
    case 'tribes-lineage':   return const Color(0xFF9A7AB8);
    case 'battles':          return const Color(0xFFC06060);
    case 'miracles':         return const Color(0xFFD4A017);
    case 'important-terms':  return const Color(0xFF6B8E9B);
    case 'places-maps':      return const Color(0xFF7A9E6B);
    default:                 return const Color(0xFFD4A017);
  }
}

const kReferenceSections = [
  ReferenceSection(id: 'family-household',  title: 'Family & Household',        titleAr: 'الأسرة والبيت',           description: 'Wives, children, and household of the Prophet ﷺ',                     descriptionAr: 'زوجات وأبناء وأهل بيت النبي ﷺ'),
  ReferenceSection(id: 'timeline',          title: 'Timeline of the Seerah',    titleAr: 'الخط الزمني للسيرة',       description: 'Chronological timeline of major events',                              descriptionAr: 'خط زمني لأهم الأحداث'),
  ReferenceSection(id: 'key-people',        title: 'Key People',                titleAr: 'أبرز الشخصيات',            description: 'Companions, leaders, and figures of the Seerah',                       descriptionAr: 'الصحابة والقادة وأبرز الشخصيات في السيرة'),
  ReferenceSection(id: 'tribes-lineage',    title: 'Tribes and Lineage',        titleAr: 'القبائل والنسب',           description: 'The major Arab tribes and the Prophet\'s ﷺ lineage',                  descriptionAr: 'أهم القبائل العربية ونسب النبي ﷺ'),
  ReferenceSection(id: 'battles',           title: 'Battles and Expeditions',   titleAr: 'الغزوات والسرايا',         description: 'Major battles, campaigns, and expeditions',                           descriptionAr: 'أهم المعارك والحملات والغزوات'),
  ReferenceSection(id: 'miracles',          title: 'Miracles and Signs',        titleAr: 'المعجزات والآيات',         description: 'Verified miracles from Qur\'an and Sahih hadith',                      descriptionAr: 'معجزات موثقة من القرآن والحديث الصحيح'),
  ReferenceSection(id: 'important-terms',   title: 'Important Terms',           titleAr: 'مصطلحات مهمة',             description: 'A glossary of Arabic and historical terms',                           descriptionAr: 'قاموس للمصطلحات العربية والتاريخية'),
  ReferenceSection(id: 'places-maps',       title: 'Places and Maps',           titleAr: 'الأماكن والخرائط',         description: 'Key cities, routes, and locations in the Seerah',                     descriptionAr: 'أهم المدن والطرق والمواقع في السيرة'),
];

// ── Family & Household ────────────────────────────────────────────────────────

class WifeEntry {
  final String name;
  final String nameAr;
  final bool hasChildren;
  final String notes;
  final String notesAr;
  const WifeEntry({required this.name, required this.nameAr, required this.hasChildren, required this.notes, required this.notesAr});

  String localizedName(String lang) => lang == 'ar' ? nameAr : name;
  String localizedNotes(String lang) => lang == 'ar' ? notesAr : notes;
}

const kWives = [
  WifeEntry(name: 'Khadijah bint Khuwaylid',   nameAr: 'خديجة بنت خويلد ؓ',   hasChildren: true,  notes: 'Mother of all his children except Ibrahim. First person to believe in him.', notesAr: 'أم جميع أبنائه إلا إبراهيم. أول من آمن به.'),
  WifeEntry(name: "Sawdah bint Zam'ah",         nameAr: 'سودة بنت زمعة ؓ',     hasChildren: false, notes: 'One of the Mothers of the Believers. Showed great loyalty.', notesAr: 'إحدى أمهات المؤمنين. أظهرت وفاءً عظيمًا.'),
  WifeEntry(name: 'Aishah bint Abi Bakr',       nameAr: 'عائشة بنت أبي بكر ؓ', hasChildren: false, notes: 'Major narrator of hadith. Daughter of Abu Bakr al-Siddiq.', notesAr: 'من كبار رواة الحديث. ابنة أبي بكر الصديق.'),
  WifeEntry(name: 'Hafsah bint Umar',           nameAr: 'حفصة بنت عمر ؓ',      hasChildren: false, notes: 'Daughter of Umar ibn al-Khattab. Guardian of an early copy of the Qur\'an.', notesAr: 'ابنة عمر بن الخطاب. كانت حافظة لنسخة مبكرة من القرآن.'),
  WifeEntry(name: 'Zaynab bint Khuzaymah',      nameAr: 'زينب بنت خزيمة ؓ',    hasChildren: false, notes: 'Known as "Mother of the Poor" for her generosity.', notesAr: 'عُرفت بـ"أم المساكين" لكرمها.'),
  WifeEntry(name: 'Umm Salamah',                nameAr: 'أم سلمة ؓ',           hasChildren: false, notes: 'Known for wisdom and sound judgment.', notesAr: 'عُرفت بحكمتها وحسن رأيها.'),
  WifeEntry(name: 'Zaynab bint Jahsh',          nameAr: 'زينب بنت جحش ؓ',      hasChildren: false, notes: 'Her marriage is mentioned in the Qur\'an.', notesAr: 'ذُكر زواجها في القرآن الكريم.'),
  WifeEntry(name: "Juwayriyah bint al-Harith",  nameAr: 'جويرية بنت الحارث ؓ', hasChildren: false, notes: 'From Banu al-Mustaliq. Her marriage freed many captives.', notesAr: 'من بني المصطلق. أدى زواجها إلى تحرير كثير من الأسرى.'),
  WifeEntry(name: 'Umm Habibah',                nameAr: 'أم حبيبة ؓ',          hasChildren: false, notes: 'Daughter of Abu Sufyan. Remained firm in faith despite early hardship.', notesAr: 'ابنة أبي سفيان. ثبتت على إيمانها رغم المشقة في بداياتها.'),
  WifeEntry(name: "Safiyyah bint Huyayy",       nameAr: 'صفية بنت حيي ؓ',      hasChildren: false, notes: 'From Banu al-Nadir. From a noble Jewish family.', notesAr: 'من بني النضير. من عائلة يهودية نبيلة.'),
  WifeEntry(name: "Maymunah bint al-Harith",    nameAr: 'ميمونة بنت الحارث ؓ', hasChildren: false, notes: 'The last wife the Prophet ﷺ married.', notesAr: 'آخر من تزوجها النبي ﷺ.'),
];

class ChildEntry {
  final String name;
  final String nameAr;
  final String mother;
  final String motherAr;
  final String notes;
  final String notesAr;
  const ChildEntry({required this.name, required this.nameAr, required this.mother, required this.motherAr, required this.notes, required this.notesAr});

  String localizedName(String lang) => lang == 'ar' ? nameAr : name;
  String localizedMother(String lang) => lang == 'ar' ? motherAr : mother;
  String localizedNotes(String lang) => lang == 'ar' ? notesAr : notes;
}

const kChildren = [
  ChildEntry(name: 'Al-Qasim',    nameAr: 'القاسم',    mother: 'Khadijah',              motherAr: 'خديجة',            notes: 'Died young.', notesAr: 'توفي صغيرًا.'),
  ChildEntry(name: 'Zaynab',      nameAr: 'زينب',      mother: 'Khadijah',              motherAr: 'خديجة',            notes: 'Daughter.', notesAr: 'ابنته.'),
  ChildEntry(name: 'Ruqayyah',    nameAr: 'رقية',      mother: 'Khadijah',              motherAr: 'خديجة',            notes: 'Daughter. Married Uthman ibn Affan.', notesAr: 'ابنته. تزوجت عثمان بن عفان.'),
  ChildEntry(name: 'Umm Kulthum', nameAr: 'أم كلثوم',  mother: 'Khadijah',              motherAr: 'خديجة',            notes: 'Daughter. Later married Uthman ibn Affan.', notesAr: 'ابنته. تزوجت عثمان بن عفان بعد ذلك.'),
  ChildEntry(name: 'Fatimah',     nameAr: 'فاطمة',     mother: 'Khadijah',              motherAr: 'خديجة',            notes: 'The Prophet\'s ﷺ lineage continued through her.', notesAr: 'استمر نسل النبي ﷺ من خلالها.'),
  ChildEntry(name: 'Abdullah',    nameAr: 'عبد الله',  mother: 'Khadijah',              motherAr: 'خديجة',            notes: 'Also known as al-Tayyib and al-Tahir.', notesAr: 'يُعرف أيضًا بالطيب والطاهر.'),
  ChildEntry(name: 'Ibrahim',     nameAr: 'إبراهيم',   mother: 'Mariyah al-Qibtiyyah',  motherAr: 'مارية القبطية',    notes: 'Died in childhood.', notesAr: 'توفي في طفولته.'),
];

// ── Timeline ──────────────────────────────────────────────────────────────────

class TimelineEvent {
  final String date;
  final String title;
  final String titleAr;
  final String description;
  final String descriptionAr;
  const TimelineEvent({required this.date, required this.title, required this.titleAr, required this.description, required this.descriptionAr});

  String localizedTitle(String lang) => lang == 'ar' ? titleAr : title;
  String localizedDescription(String lang) => lang == 'ar' ? descriptionAr : description;
}

const kTimeline = [
  TimelineEvent(date: '570 CE',          title: 'Birth in Makkah',             titleAr: 'الميلاد في مكة',         description: 'The Prophet Muhammad ﷺ was born in Makkah into the noble clan of Banu Hashim.', descriptionAr: 'وُلد النبي محمد ﷺ في مكة في قبيلة بني هاشم الشريفة.'),
  TimelineEvent(date: '576 CE',          title: 'Orphaned at a Young Age',     titleAr: 'اليتم في صغره',           description: 'After losing his father before birth, his mother passed when he was around six. He was raised by his grandfather, then uncle.', descriptionAr: 'بعد وفاة والده قبل ولادته، توفيت والدته وهو في السادسة تقريبًا. فتربى في كنف جده، ثم عمه.'),
  TimelineEvent(date: '595 CE',          title: 'Marriage to Khadijah ؓ',      titleAr: 'الزواج من خديجة ؓ',       description: 'He married Khadijah ؓ, the first person to believe in him and his greatest supporter.', descriptionAr: 'تزوج خديجة ؓ، أول من آمن به وأعظم من ساندَه.'),
  TimelineEvent(date: '610 CE',          title: 'First Revelation',            titleAr: 'الوحي الأول',             description: 'The first revelation came through Jibreel ؑ in the Cave of Hira, beginning his Prophethood.', descriptionAr: 'نزل الوحي الأول عن طريق جبريل ؑ في غار حراء، لتبدأ بذلك رسالته.'),
  TimelineEvent(date: '613 CE',          title: 'Public Call Begins',          titleAr: 'بداية الدعوة العلنية',    description: 'After private dawah, the Prophet ﷺ began calling people publicly to worship Allah alone.', descriptionAr: 'بعد الدعوة السرية، بدأ النبي ﷺ يدعو الناس علنًا لعبادة الله وحده.'),
  TimelineEvent(date: '615 CE',          title: 'Migration to Abyssinia',      titleAr: 'الهجرة إلى الحبشة',       description: 'Some early Muslims migrated to Abyssinia to escape persecution and preserve their religion.', descriptionAr: 'هاجر بعض المسلمين الأوائل إلى الحبشة هربًا من الأذى وحفاظًا على دينهم.'),
  TimelineEvent(date: '619 CE',          title: 'The Year of Sorrow',          titleAr: 'عام الحزن',               description: 'Khadijah ؓ and Abu Talib both passed away — two of his strongest supporters.', descriptionAr: 'توفيت خديجة ؓ وأبو طالب في هذا العام — وكانا من أقوى من ساندَه.'),
  TimelineEvent(date: '620–621 CE',      title: 'Isra and Miʿraj',             titleAr: 'الإسراء والمعراج',        description: 'The Night Journey and Ascension. The command for the five daily prayers was given.', descriptionAr: 'رحلة الإسراء والمعراج، حيث فُرضت الصلوات الخمس.'),
  TimelineEvent(date: '622 CE / 1 AH',   title: 'Hijrah to Madinah',           titleAr: 'الهجرة إلى المدينة',      description: 'The Prophet ﷺ migrated to Madinah. This event marks the start of the Islamic calendar.', descriptionAr: 'هاجر النبي ﷺ إلى المدينة، وهذا الحدث يمثل بداية التقويم الهجري.'),
  TimelineEvent(date: '624 CE / 2 AH',   title: 'Battle of Badr',              titleAr: 'غزوة بدر',                description: 'A decisive Muslim victory. A major turning point for the early Muslim community.', descriptionAr: 'انتصار حاسم للمسلمين، ونقطة تحول مهمة للمجتمع المسلم الناشئ.'),
  TimelineEvent(date: '625 CE / 3 AH',   title: 'Battle of Uhud',              titleAr: 'غزوة أحد',                description: 'A painful setback. Lessons about obedience, patience, and discipline.', descriptionAr: 'نكسة مؤلمة، حملت دروسًا في الطاعة والصبر والانضباط.'),
  TimelineEvent(date: '627 CE / 5 AH',   title: 'Battle of the Trench',        titleAr: 'غزوة الخندق',             description: 'The Muslims defended Madinah during a major siege. Allah protected the believers.', descriptionAr: 'دافع المسلمون عن المدينة خلال حصار كبير، وحفظ الله المؤمنين.'),
  TimelineEvent(date: '628 CE / 6 AH',   title: 'Treaty of Hudaybiyyah',       titleAr: 'صلح الحديبية',            description: 'A treaty with Quraysh that seemed difficult at first — but became a major opening for Islam.', descriptionAr: 'معاهدة مع قريش بدت صعبة في البداية، لكنها أصبحت فتحًا عظيمًا للإسلام.'),
  TimelineEvent(date: '630 CE / 8 AH',   title: 'Conquest of Makkah',          titleAr: 'فتح مكة',                 description: 'The Prophet ﷺ entered Makkah victorious and forgave those who had wronged him.', descriptionAr: 'دخل النبي ﷺ مكة فاتحًا وعفا عن من ظلمه.'),
  TimelineEvent(date: '630 CE / 8 AH',   title: 'Hunayn and Ta\'if',           titleAr: 'حنين والطائف',            description: 'After Makkah, the Muslims faced new tests. Arabian tribes continued entering Islam.', descriptionAr: 'بعد فتح مكة، واجه المسلمون اختبارات جديدة، واستمرت القبائل العربية في دخول الإسلام.'),
  TimelineEvent(date: '631 CE / 9 AH',   title: 'Year of Delegations',         titleAr: 'عام الوفود',              description: 'Tribes from across Arabia came to Madinah accepting Islam.', descriptionAr: 'قدمت القبائل من مختلف أنحاء الجزيرة العربية إلى المدينة معلنة إسلامها.'),
  TimelineEvent(date: '632 CE / 10 AH',  title: 'Farewell Hajj',               titleAr: 'حجة الوداع',              description: 'The Prophet ﷺ performed his final Hajj and delivered his famous farewell sermon.', descriptionAr: 'أدى النبي ﷺ حجته الأخيرة وخطب خطبة الوداع المشهورة.'),
  TimelineEvent(date: '632 CE / 11 AH',  title: 'Passing of the Prophet ﷺ',   titleAr: 'وفاة النبي ﷺ',            description: 'The Prophet ﷺ passed away in Madinah after completing his mission.', descriptionAr: 'توفي النبي ﷺ في المدينة بعد أن أتم رسالته.'),
];

// ── Battles and Expeditions ───────────────────────────────────────────────────

class BattleEvent {
  final String date;
  final String name;
  final String nameAr;
  final String type;
  final String typeAr;
  final String outcome;
  final String outcomeAr;
  final String significance;
  final String significanceAr;
  const BattleEvent({
    required this.date,
    required this.name,
    required this.nameAr,
    required this.type,
    required this.typeAr,
    required this.outcome,
    required this.outcomeAr,
    required this.significance,
    required this.significanceAr,
  });

  String localizedName(String lang) => lang == 'ar' ? nameAr : name;
  String localizedType(String lang) => lang == 'ar' ? typeAr : type;
  String localizedOutcome(String lang) => lang == 'ar' ? outcomeAr : outcome;
  String localizedSignificance(String lang) => lang == 'ar' ? significanceAr : significance;
}

const kBattles = [
  BattleEvent(date: '2 AH / 624 CE',  name: 'Battle of Badr',           nameAr: 'غزوة بدر',           type: 'Major Battle',    typeAr: 'معركة كبرى',    outcome: 'Muslim Victory',     outcomeAr: 'انتصار للمسلمين',   significance: 'First major military victory. Proved the Muslims could defend themselves.', significanceAr: 'أول انتصار عسكري كبير. أثبت قدرة المسلمين على الدفاع عن أنفسهم.'),
  BattleEvent(date: '3 AH / 625 CE',  name: 'Battle of Uhud',           nameAr: 'غزوة أحد',           type: 'Major Battle',    typeAr: 'معركة كبرى',    outcome: 'Setback',            outcomeAr: 'نكسة',              significance: 'A test of patience after archers left their positions. Hamzah ؓ was martyred.', significanceAr: 'اختبار للصبر بعد ترك الرماة مواقعهم. استُشهد حمزة ؓ.'),
  BattleEvent(date: '5 AH / 627 CE',  name: 'Battle of the Trench',     nameAr: 'غزوة الخندق',        type: 'Major Battle',    typeAr: 'معركة كبرى',    outcome: 'Muslim Defence',     outcomeAr: 'دفاع المسلمين',     significance: 'Madinah was besieged. The trench strategy kept the enemy out for weeks.', significanceAr: 'حوصرت المدينة. أبقت استراتيجية الخندق العدو خارجها لأسابيع.'),
  BattleEvent(date: '6 AH / 628 CE',  name: 'Treaty of Hudaybiyyah',    nameAr: 'صلح الحديبية',       type: 'Treaty',          typeAr: 'معاهدة',        outcome: 'Peace Agreement',    outcomeAr: 'اتفاق سلام',        significance: 'Seemed unfair but opened the door to mass conversions across Arabia.', significanceAr: 'بدت غير عادلة لكنها فتحت الباب لدخول أعداد كبيرة في الإسلام في الجزيرة العربية.'),
  BattleEvent(date: '7 AH / 629 CE',  name: 'Battle of Khaybar',        nameAr: 'غزوة خيبر',          type: 'Campaign',        typeAr: 'حملة',          outcome: 'Muslim Victory',     outcomeAr: 'انتصار للمسلمين',   significance: 'Jewish strongholds north of Madinah were taken. Generous terms given.', significanceAr: 'تم الاستيلاء على معاقل يهودية شمال المدينة، وأُعطيت شروط سخية.'),
  BattleEvent(date: '7 AH / 629 CE',  name: 'Battle of Mu\'tah',        nameAr: 'غزوة مؤتة',          type: 'Campaign',        typeAr: 'حملة',          outcome: 'Tactical Withdrawal',outcomeAr: 'انسحاب تكتيكي',     significance: 'First clash with Byzantine forces. Zayd ibn Harithah, Ja\'far, and ibn Rawahah ؓ were martyred.', significanceAr: 'أول صدام مع القوات البيزنطية. استُشهد زيد بن حارثة وجعفر وابن رواحة ؓ.'),
  BattleEvent(date: '8 AH / 630 CE',  name: 'Conquest of Makkah',       nameAr: 'فتح مكة',            type: 'Campaign',        typeAr: 'حملة',          outcome: 'Bloodless Victory',  outcomeAr: 'فتح بلا قتال',      significance: 'The Prophet ﷺ entered Makkah with 10,000 — and forgave almost everyone.', significanceAr: 'دخل النبي ﷺ مكة بعشرة آلاف مقاتل، وعفا عن الجميع تقريبًا.'),
  BattleEvent(date: '8 AH / 630 CE',  name: 'Battle of Hunayn',         nameAr: 'غزوة حنين',          type: 'Major Battle',    typeAr: 'معركة كبرى',    outcome: 'Muslim Victory',     outcomeAr: 'انتصار للمسلمين',   significance: 'Initial panic gave way to rally. Allah sent sakina and unseen support.', significanceAr: 'تحول الارتباك الأولي إلى تراص، وأنزل الله السكينة والنصر غير المرئي.'),
  BattleEvent(date: '9 AH / 631 CE',  name: 'Expedition of Tabuk',      nameAr: 'غزوة تبوك',          type: 'Expedition',      typeAr: 'حملة',          outcome: 'Peaceful Return',    outcomeAr: 'عودة سلمية',        significance: 'A test of commitment. The hypocrites revealed themselves by staying behind.', significanceAr: 'اختبار للثبات، وكشف المنافقون عن أنفسهم بتخلفهم عن الخروج.'),
];

// ── Miracles and Signs ────────────────────────────────────────────────────────

class MiracleEntry {
  final String source;
  final String sourceAr;
  final String title;
  final String titleAr;
  final String description;
  final String descriptionAr;
  const MiracleEntry({
    required this.source,
    required this.sourceAr,
    required this.title,
    required this.titleAr,
    required this.description,
    required this.descriptionAr,
  });

  String localizedSource(String lang) => lang == 'ar' ? sourceAr : source;
  String localizedTitle(String lang) => lang == 'ar' ? titleAr : title;
  String localizedDescription(String lang) => lang == 'ar' ? descriptionAr : description;
}

const kMiracles = [
  MiracleEntry(source: 'Qur\'an',          sourceAr: 'القرآن',         title: 'The Qur\'an Itself',            titleAr: 'القرآن نفسه',                description: 'The Qur\'an is the Prophet\'s ﷺ greatest miracle — inimitable in language, structure, prophecy, and knowledge. It remains unchanged since revelation. (Al-Baqarah 2:23)', descriptionAr: 'القرآن هو أعظم معجزة للنبي ﷺ — لا يُضاهى في لغته وبنائه ونبوءاته وعلمه. وبقي دون تغيير منذ نزوله. (البقرة ٢:٢٣)'),
  MiracleEntry(source: 'Qur\'an',          sourceAr: 'القرآن',         title: 'Splitting of the Moon',         titleAr: 'انشقاق القمر',                description: 'Allah split the moon as a sign for the Quraysh. (Al-Qamar 54:1-2)', descriptionAr: 'شقّ الله القمر آيةً لقريش. (القمر ٥٤: ١-٢)'),
  MiracleEntry(source: 'Qur\'an',          sourceAr: 'القرآن',         title: 'The Isra and Miʿraj',           titleAr: 'الإسراء والمعراج',            description: 'The Night Journey from Makkah to Jerusalem and ascension through the heavens. (Al-Isra 17:1)', descriptionAr: 'رحلة ليلية من مكة إلى القدس وعروج عبر السماوات. (الإسراء ١٧:١)'),
  MiracleEntry(source: 'Sahih al-Bukhari', sourceAr: 'صحيح البخاري',   title: 'Water Flowing from His Fingers', titleAr: 'الماء يتفجر من بين أصابعه',   description: 'At Hudaybiyyah, water flowed from between his fingers, enough for 1,500 companions to drink. (Bukhari 3576)', descriptionAr: 'في الحديبية، تفجر الماء من بين أصابعه، فكفى ١٥٠٠ من الصحابة للشرب. (البخاري ٣٥٧٦)'),
  MiracleEntry(source: 'Sahih al-Bukhari', sourceAr: 'صحيح البخاري',   title: 'Food Multiplied at Jabir\'s Home', titleAr: 'تكاثر الطعام في بيت جابر',   description: 'A small amount of food fed the entire army at the Battle of the Trench. (Bukhari 4101)', descriptionAr: 'كمية قليلة من الطعام أشبعت الجيش كله في غزوة الخندق. (البخاري ٤١٠١)'),
  MiracleEntry(source: 'Sahih al-Bukhari', sourceAr: 'صحيح البخاري',   title: 'The Tree Trunk Cried',           titleAr: 'بكاء جذع النخلة',             description: 'The date palm trunk wept audibly when the Prophet ﷺ moved to the minbar. (Bukhari 3583)', descriptionAr: 'بكى جذع النخلة بصوت مسموع عندما انتقل النبي ﷺ إلى المنبر. (البخاري ٣٥٨٣)'),
  MiracleEntry(source: 'Sahih al-Bukhari', sourceAr: 'صحيح البخاري',   title: 'Spitting into the Eye of Ali ؓ', titleAr: 'وضع الريق في عين علي ؓ',      description: 'Ali ؓ was healed of severe eye pain by the Prophet\'s ﷺ saliva at Khaybar. (Bukhari 2942)', descriptionAr: 'شُفي علي ؓ من ألم شديد في عينه بريق النبي ﷺ في خيبر. (البخاري ٢٩٤٢)'),
  MiracleEntry(source: 'Sahih Muslim',     sourceAr: 'صحيح مسلم',      title: 'Stones Glorified Allah in His Hand', titleAr: 'تسبيح الحصى في يده',       description: 'Pebbles in the Prophet\'s ﷺ palm were heard glorifying Allah. (Muslim 2279)', descriptionAr: 'سُمعت الحصى في كف النبي ﷺ تسبّح الله. (مسلم ٢٢٧٩)'),
  MiracleEntry(source: 'Sahih Muslim',     sourceAr: 'صحيح مسلم',      title: 'Prediction of the Death of Najashi', titleAr: 'الإخبار بوفاة النجاشي',   description: 'The Prophet ﷺ announced the death of the Negus on the very day it occurred in Abyssinia. (Muslim 953)', descriptionAr: 'أخبر النبي ﷺ بوفاة النجاشي في اليوم الذي توفي فيه في الحبشة. (مسلم ٩٥٣)'),
  MiracleEntry(source: 'Qur\'an',          sourceAr: 'القرآن',         title: 'Prophecy of Roman Victory',     titleAr: 'نبوءة انتصار الروم',          description: 'The Qur\'an predicted the Roman victory over Persia within a few years — fulfilled exactly. (Ar-Rum 30:2-4)', descriptionAr: 'تنبأ القرآن بانتصار الروم على فارس خلال سنوات قليلة — وتحقق ذلك بدقة. (الروم ٣٠: ٢-٤)'),
];

// ── Important Terms ───────────────────────────────────────────────────────────

class TermEntry {
  final String arabic;
  final String transliteration;
  final String category;
  final String categoryAr;
  final String definition;
  final String definitionAr;
  const TermEntry({
    required this.arabic,
    required this.transliteration,
    required this.category,
    required this.categoryAr,
    required this.definition,
    required this.definitionAr,
  });

  String localizedCategory(String lang) => lang == 'ar' ? categoryAr : category;
  String localizedDefinition(String lang) => lang == 'ar' ? definitionAr : definition;
}

const kTerms = [
  TermEntry(arabic: 'سيرة',       transliteration: 'Seerah',         category: 'Study',         categoryAr: 'دراسة',    definition: 'The biography of the Prophet Muhammad ﷺ — his life, actions, and character.', definitionAr: 'السيرة النبوية — حياة النبي محمد ﷺ وأعماله وأخلاقه.'),
  TermEntry(arabic: 'نبي',        transliteration: 'Nabi',           category: 'Prophethood',   categoryAr: 'النبوة',   definition: 'A Prophet — one who receives revelation from Allah.', definitionAr: 'نبي — من يتلقى الوحي من الله.'),
  TermEntry(arabic: 'رسول',       transliteration: 'Rasul',          category: 'Prophethood',   categoryAr: 'النبوة',   definition: 'A Messenger — a Prophet sent with a message and a law for a people.', definitionAr: 'رسول — نبي أُرسل برسالة وشريعة لقوم.'),
  TermEntry(arabic: 'وحي',        transliteration: 'Wahy',           category: 'Revelation',    categoryAr: 'الوحي',    definition: 'Divine revelation — the communication from Allah to His Prophet.', definitionAr: 'الوحي الإلهي — التواصل من الله إلى نبيه.'),
  TermEntry(arabic: 'صحابة',      transliteration: 'Sahabah',        category: 'People',        categoryAr: 'أشخاص',    definition: 'The Companions — those who met the Prophet ﷺ, believed in him, and died as Muslims.', definitionAr: 'الصحابة — من لقوا النبي ﷺ وآمنوا به وماتوا على الإسلام.'),
  TermEntry(arabic: 'هجرة',       transliteration: 'Hijrah',         category: 'Events',        categoryAr: 'أحداث',    definition: 'The migration of the Prophet ﷺ and his Companions from Makkah to Madinah in 622 CE.', definitionAr: 'هجرة النبي ﷺ وأصحابه من مكة إلى المدينة سنة ٦٢٢م.'),
  TermEntry(arabic: 'جاهلية',     transliteration: 'Jahiliyyah',     category: 'History',       categoryAr: 'تاريخ',    definition: 'The Age of Ignorance — the pre-Islamic era in Arabia characterized by idol worship and tribal violence.', definitionAr: 'الجاهلية — العصر السابق للإسلام في الجزيرة العربية، الذي تميز بعبادة الأصنام والعنف القبلي.'),
  TermEntry(arabic: 'قريش',       transliteration: 'Quraysh',        category: 'Tribes',        categoryAr: 'قبائل',    definition: 'The dominant tribe of Makkah. The Prophet ﷺ was from the Quraysh, specifically the Banu Hashim clan.', definitionAr: 'القبيلة المسيطرة في مكة. كان النبي ﷺ من قريش، وبالتحديد من بني هاشم.'),
  TermEntry(arabic: 'كعبة',       transliteration: "Ka'bah",         category: 'Places',        categoryAr: 'أماكن',    definition: 'The cubic structure in Makkah built by Ibrahim ؑ and Ismail ؑ. The qibla of the Muslims.', definitionAr: 'البناء المكعب في مكة الذي بناه إبراهيم ؑ وإسماعيل ؑ. قبلة المسلمين.'),
  TermEntry(arabic: 'مسجد',       transliteration: 'Masjid',         category: 'Places',        categoryAr: 'أماكن',    definition: 'A mosque — a place of prayer and worship in Islam.', definitionAr: 'مسجد — مكان للصلاة والعبادة في الإسلام.'),
  TermEntry(arabic: 'سنة',        transliteration: 'Sunnah',         category: 'Study',         categoryAr: 'دراسة',    definition: 'The actions, sayings, and approvals of the Prophet ﷺ. The second primary source of Islamic law.', definitionAr: 'أفعال النبي ﷺ وأقواله وتقريراته. المصدر الثاني للشريعة الإسلامية.'),
  TermEntry(arabic: 'حديث',       transliteration: 'Hadith',         category: 'Study',         categoryAr: 'دراسة',    definition: 'A narration of the Prophet\'s ﷺ words, actions, or approvals.', definitionAr: 'رواية عن أقوال النبي ﷺ أو أفعاله أو تقريراته.'),
  TermEntry(arabic: 'إسلام',      transliteration: 'Islam',          category: 'Religion',      categoryAr: 'الدين',    definition: 'Complete submission to the will of Allah — the religion revealed to Muhammad ﷺ.', definitionAr: 'الاستسلام الكامل لإرادة الله — الدين الذي أُنزل على محمد ﷺ.'),
  TermEntry(arabic: 'ايمان',      transliteration: 'Iman',           category: 'Religion',      categoryAr: 'الدين',    definition: 'Faith — belief in Allah, His angels, His books, His messengers, the Last Day, and divine decree.', definitionAr: 'الإيمان — التصديق بالله وملائكته وكتبه ورسله واليوم الآخر والقدر.'),
  TermEntry(arabic: 'دعوة',       transliteration: "Da'wah",         category: 'Events',        categoryAr: 'أحداث',    definition: 'The call to Islam — inviting others to the faith through speech, example, and wisdom.', definitionAr: 'الدعوة إلى الإسلام — دعوة الآخرين إلى الدين بالقول والقدوة والحكمة.'),
  TermEntry(arabic: 'شهادة',      transliteration: 'Shahada',        category: 'Religion',      categoryAr: 'الدين',    definition: 'The declaration of faith: "There is no god but Allah, and Muhammad is the Messenger of Allah."', definitionAr: 'شهادة التوحيد: "لا إله إلا الله، محمد رسول الله".'),
  TermEntry(arabic: 'غزوة',       transliteration: 'Ghazwah',        category: 'Military',      categoryAr: 'عسكري',    definition: 'A military expedition in which the Prophet ﷺ personally participated.', definitionAr: 'غزوة عسكرية شارك فيها النبي ﷺ بنفسه.'),
  TermEntry(arabic: 'سرية',       transliteration: 'Sariyyah',       category: 'Military',      categoryAr: 'عسكري',    definition: 'A military expedition sent by the Prophet ﷺ but which he did not personally join.', definitionAr: 'حملة عسكرية أرسلها النبي ﷺ ولم يشارك فيها بنفسه.'),
  TermEntry(arabic: 'أنصار',      transliteration: 'Ansar',          category: 'People',        categoryAr: 'أشخاص',    definition: 'The Helpers — the Muslims of Madinah who welcomed and supported the Meccan emigrants.', definitionAr: 'الأنصار — مسلمو المدينة الذين استقبلوا المهاجرين من مكة ودعموهم.'),
  TermEntry(arabic: 'مهاجرون',    transliteration: 'Muhajirun',      category: 'People',        categoryAr: 'أشخاص',    definition: 'The Emigrants — Muslims who migrated from Makkah to Madinah for the sake of Allah.', definitionAr: 'المهاجرون — المسلمون الذين هاجروا من مكة إلى المدينة في سبيل الله.'),
];

// ── Key People ────────────────────────────────────────────────────────────────

class PersonEntry {
  final String name;
  final String nameAr;
  final String category;
  final String categoryAr;
  final String role;
  final String roleAr;
  final String description;
  final String descriptionAr;
  const PersonEntry({
    required this.name,
    required this.nameAr,
    required this.category,
    required this.categoryAr,
    required this.role,
    required this.roleAr,
    required this.description,
    required this.descriptionAr,
  });

  String localizedName(String lang) => lang == 'ar' ? nameAr : name;
  String localizedCategory(String lang) => lang == 'ar' ? categoryAr : category;
  String localizedRole(String lang) => lang == 'ar' ? roleAr : role;
  String localizedDescription(String lang) => lang == 'ar' ? descriptionAr : description;
}

const kKeyPeople = [
  PersonEntry(name: 'Abu Bakr al-Siddiq ؓ',       nameAr: 'أبو بكر الصديق ؓ',      category: 'The Ten Given Glad Tidings', categoryAr: 'العشرة المبشرون بالجنة', role: 'First Caliph',                      roleAr: 'الخليفة الأول',              description: 'The closest companion of the Prophet ﷺ and first Caliph after his passing.', descriptionAr: 'أقرب أصحاب النبي ﷺ، وأول خليفة بعد وفاته.'),
  PersonEntry(name: 'Umar ibn al-Khattab ؓ',       nameAr: 'عمر بن الخطاب ؓ',       category: 'The Ten Given Glad Tidings', categoryAr: 'العشرة المبشرون بالجنة', role: 'Second Caliph',                     roleAr: 'الخليفة الثاني',             description: 'Known for his justice, strength, and decisive leadership. Second Caliph.', descriptionAr: 'عُرف بعدله وقوته وحزمه في القيادة. الخليفة الثاني.'),
  PersonEntry(name: 'Uthman ibn Affan ؓ',          nameAr: 'عثمان بن عفان ؓ',       category: 'The Ten Given Glad Tidings', categoryAr: 'العشرة المبشرون بالجنة', role: 'Third Caliph',                      roleAr: 'الخليفة الثالث',             description: 'Married two daughters of the Prophet ﷺ. Compiled the Mushaf.', descriptionAr: 'تزوج بابنتين من بنات النبي ﷺ. جمع القرآن في مصحف واحد.'),
  PersonEntry(name: 'Ali ibn Abi Talib ؓ',         nameAr: 'علي بن أبي طالب ؓ',     category: 'The Ten Given Glad Tidings', categoryAr: 'العشرة المبشرون بالجنة', role: 'Fourth Caliph',                     roleAr: 'الخليفة الرابع',             description: 'The Prophet\'s cousin and son-in-law. Husband of Fatimah ؓ.', descriptionAr: 'ابن عم النبي ﷺ وصهره. زوج فاطمة ؓ.'),
  PersonEntry(name: 'Talha ibn Ubaydullah ؓ',      nameAr: 'طلحة بن عبيد الله ؓ',   category: 'The Ten Given Glad Tidings', categoryAr: 'العشرة المبشرون بالجنة', role: 'Companion and warrior',             roleAr: 'صحابي ومحارب',               description: 'Protected the Prophet ﷺ with his hand at Uhud.', descriptionAr: 'حمى النبي ﷺ بيده في غزوة أحد.'),
  PersonEntry(name: 'al-Zubayr ibn al-Awwam ؓ',   nameAr: 'الزبير بن العوام ؓ',    category: 'The Ten Given Glad Tidings', categoryAr: 'العشرة المبشرون بالجنة', role: 'Companion',                         roleAr: 'صحابي',                      description: 'Called the disciple of the Prophet ﷺ. Among the earliest Muslims.', descriptionAr: 'لُقّب بحواري النبي ﷺ. من أوائل المسلمين.'),
  PersonEntry(name: 'Abdur Rahman ibn Awf ؓ',      nameAr: 'عبد الرحمن بن عوف ؓ',   category: 'The Ten Given Glad Tidings', categoryAr: 'العشرة المبشرون بالجنة', role: 'Companion and scholar',             roleAr: 'صحابي وعالم',                description: 'Wealthy merchant known for generosity and sacrifice.', descriptionAr: 'تاجر ثري عُرف بالكرم والتضحية.'),
  PersonEntry(name: "Sa'd ibn Abi Waqqas ؓ",       nameAr: 'سعد بن أبي وقاص ؓ',     category: 'The Ten Given Glad Tidings', categoryAr: 'العشرة المبشرون بالجنة', role: 'Companion',                         roleAr: 'صحابي',                      description: 'The first to shoot an arrow in the cause of Islam.', descriptionAr: 'أول من رمى بسهم في سبيل الإسلام.'),
  PersonEntry(name: 'Said ibn Zayd ؓ',             nameAr: 'سعيد بن زيد ؓ',         category: 'The Ten Given Glad Tidings', categoryAr: 'العشرة المبشرون بالجنة', role: 'Companion',                         roleAr: 'صحابي',                      description: 'Among the earliest believers and the glad tidings ten.', descriptionAr: 'من أوائل المؤمنين ومن العشرة المبشرين بالجنة.'),
  PersonEntry(name: 'Abu Ubayda ibn al-Jarrah ؓ',  nameAr: 'أبو عبيدة بن الجراح ؓ', category: 'The Ten Given Glad Tidings', categoryAr: 'العشرة المبشرون بالجنة', role: 'Trustee of the Ummah',              roleAr: 'أمين الأمة',                 description: 'Called "the Trustee of this Ummah" by the Prophet ﷺ.', descriptionAr: 'لقّبه النبي ﷺ بـ"أمين هذه الأمة".'),
  PersonEntry(name: 'Khadijah bint Khuwaylid ؓ',   nameAr: 'خديجة بنت خويلد ؓ',     category: 'Mothers of the Believers',   categoryAr: 'أمهات المؤمنين',        role: 'First Wife of the Prophet ﷺ',      roleAr: 'أول زوجة للنبي ﷺ',           description: 'First to believe in the Prophet ﷺ. His greatest supporter.', descriptionAr: 'أول من آمن بالنبي ﷺ. وأعظم من ساندَه.'),
  PersonEntry(name: 'Aishah bint Abi Bakr ؓ',      nameAr: 'عائشة بنت أبي بكر ؓ',   category: 'Mothers of the Believers',   categoryAr: 'أمهات المؤمنين',        role: 'Wife and Scholar',                  roleAr: 'زوجة وعالمة',                description: 'Narrated thousands of hadith. One of the most knowledgeable women of the Ummah.', descriptionAr: 'روت آلاف الأحاديث. من أعلم نساء الأمة.'),
  PersonEntry(name: 'Fatimah al-Zahra ؓ',          nameAr: 'فاطمة الزهراء ؓ',       category: 'Family of the Prophet ﷺ',    categoryAr: 'أهل بيت النبي ﷺ',       role: 'Daughter of the Prophet ﷺ',        roleAr: 'ابنة النبي ﷺ',               description: 'The Prophet\'s beloved daughter. Wife of Ali ؓ. Mother of Hasan and Husayn.', descriptionAr: 'ابنة النبي ﷺ الحبيبة. زوجة علي ؓ. أم الحسن والحسين.'),
  PersonEntry(name: 'Hamzah ibn Abd al-Muttalib ؓ', nameAr: 'حمزة بن عبد المطلب ؓ', category: 'Family of the Prophet ﷺ',   categoryAr: 'أهل بيت النبي ﷺ',       role: 'Uncle and Companion',               roleAr: 'عم وصحابي',                  description: 'The Lion of Allah. Embraced Islam and was martyred at Uhud.', descriptionAr: 'أسد الله. أسلم واستُشهد في غزوة أحد.'),
  PersonEntry(name: 'Al-Abbas ibn Abd al-Muttalib ؓ', nameAr: 'العباس بن عبد المطلب ؓ', category: 'Family of the Prophet ﷺ', categoryAr: 'أهل بيت النبي ﷺ',       role: 'Uncle and Companion',               roleAr: 'عم وصحابي',                  description: 'The Prophet\'s uncle. Became Muslim and was honored greatly.', descriptionAr: 'عم النبي ﷺ. أسلم وكان له تكريم عظيم.'),
  PersonEntry(name: 'Bilal ibn Rabah ؓ',            nameAr: 'بلال بن رباح ؓ',        category: 'Early Converts',             categoryAr: 'أوائل المسلمين',       role: 'First Muadhdhin',                   roleAr: 'أول مؤذن',                   description: 'Freed slave from Abyssinia. First caller to prayer in Islam.', descriptionAr: 'عبد حبشي معتَق. أول من أذّن للصلاة في الإسلام.'),
  PersonEntry(name: 'Sumayya bint Khayyat ؓ',       nameAr: 'سمية بنت خياط ؓ',       category: 'Early Converts',             categoryAr: 'أوائل المسلمين',       role: 'First Martyr in Islam',             roleAr: 'أول شهيدة في الإسلام',       description: 'The first martyr in Islam. Killed for refusing to abandon her faith.', descriptionAr: 'أول شهيدة في الإسلام. قُتلت لرفضها التنازل عن دينها.'),
  PersonEntry(name: "Mus'ab ibn Umayr ؓ",           nameAr: 'مصعب بن عمير ؓ',        category: 'Early Converts',             categoryAr: 'أوائل المسلمين',       role: 'Ambassador to Madinah',             roleAr: 'سفير الإسلام إلى المدينة',   description: 'Sent as the first teacher to Madinah before the Hijrah.', descriptionAr: 'أُرسل كأول معلّم إلى المدينة قبل الهجرة.'),
  PersonEntry(name: 'Abu Sufyan ibn Harb ؓ',        nameAr: 'أبو سفيان بن حرب ؓ',    category: 'Later Companions',           categoryAr: 'صحابة لاحقون',          role: 'Qurayshi Leader turned Companion',   roleAr: 'زعيم قرشي أصبح صحابيًا',     description: 'Long-time opponent of Islam who embraced the faith at the Conquest of Makkah.', descriptionAr: 'كان من ألد خصوم الإسلام لفترة طويلة، ثم أسلم عند فتح مكة.'),
  PersonEntry(name: 'Khalid ibn al-Walid ؓ',        nameAr: 'خالد بن الوليد ؓ',      category: 'Military Commanders',        categoryAr: 'القادة العسكريون',      role: 'Commander of the Army',             roleAr: 'قائد الجيش',                 description: 'The Sword of Allah. Undefeated general who accepted Islam before Makkah\'s conquest.', descriptionAr: 'سيف الله المسلول. قائد لم يُهزم، أسلم قبل فتح مكة.'),
];

// ── Places ────────────────────────────────────────────────────────────────────

class PlaceEntry {
  final String name;
  final String nameAr;
  final String category;
  final String categoryAr;
  final String significance;
  final String significanceAr;
  const PlaceEntry({
    required this.name,
    required this.nameAr,
    required this.category,
    required this.categoryAr,
    required this.significance,
    required this.significanceAr,
  });

  String localizedName(String lang) => lang == 'ar' ? nameAr : name;
  String localizedCategory(String lang) => lang == 'ar' ? categoryAr : category;
  String localizedSignificance(String lang) => lang == 'ar' ? significanceAr : significance;
}

const kPlaces = [
  PlaceEntry(name: 'Makkah al-Mukarramah',    nameAr: 'مكة المكرمة',           category: 'Sacred Cities',    categoryAr: 'مدن مقدسة',      significance: 'Birthplace of the Prophet ﷺ and site of the Ka\'bah. The holiest city in Islam.', significanceAr: 'مسقط رأس النبي ﷺ وموقع الكعبة. أقدس مدينة في الإسلام.'),
  PlaceEntry(name: 'Madinah al-Munawwarah',   nameAr: 'المدينة المنورة',       category: 'Sacred Cities',    categoryAr: 'مدن مقدسة',      significance: 'City of the Prophet ﷺ. His final resting place. Second holiest city in Islam.', significanceAr: 'مدينة النبي ﷺ ومثواه الأخير. ثاني أقدس مدينة في الإسلام.'),
  PlaceEntry(name: 'Al-Masjid al-Haram',      nameAr: 'المسجد الحرام',         category: 'Sacred Mosques',   categoryAr: 'مساجد مقدسة',    significance: 'The Grand Mosque in Makkah. Contains the Ka\'bah, the Black Stone, and Zamzam.', significanceAr: 'المسجد الكبير في مكة، يضم الكعبة والحجر الأسود وبئر زمزم.'),
  PlaceEntry(name: 'Al-Masjid al-Nabawi',     nameAr: 'المسجد النبوي',         category: 'Sacred Mosques',   categoryAr: 'مساجد مقدسة',    significance: 'The Prophet\'s Mosque in Madinah. Built by the Prophet ﷺ upon his arrival.', significanceAr: 'مسجد النبي ﷺ في المدينة، بناه بنفسه عند وصوله.'),
  PlaceEntry(name: 'Cave of Hira',            nameAr: 'غار حراء',              category: 'Sites of Events',  categoryAr: 'مواقع أحداث',    significance: 'Where the first revelation was received. Located on Jabal al-Nur above Makkah.', significanceAr: 'حيث نزل الوحي الأول. يقع على جبل النور فوق مكة.'),
  PlaceEntry(name: 'Cave of Thawr',           nameAr: 'غار ثور',               category: 'Sites of Events',  categoryAr: 'مواقع أحداث',    significance: 'Where the Prophet ﷺ and Abu Bakr hid for three nights during the Hijrah.', significanceAr: 'حيث مكث النبي ﷺ وأبو بكر ثلاث ليالٍ أثناء الهجرة.'),
  PlaceEntry(name: 'Mount Arafat',            nameAr: 'جبل عرفات',             category: 'Hajj Sites',       categoryAr: 'مواقع الحج',     significance: 'Site of the farewell sermon. Standing here is the pillar of Hajj.', significanceAr: 'موقع خطبة الوداع. الوقوف فيه ركن من أركان الحج.'),
  PlaceEntry(name: 'Badr',                    nameAr: 'بدر',                   category: 'Battle Sites',     categoryAr: 'مواقع المعارك',  significance: 'Site of the first major battle. A valley between Makkah and Madinah.', significanceAr: 'موقع أول معركة كبرى. واد بين مكة والمدينة.'),
  PlaceEntry(name: 'Uhud',                    nameAr: 'أُحد',                  category: 'Battle Sites',     categoryAr: 'مواقع المعارك',  significance: 'Mountain near Madinah. Site of the Battle of Uhud.', significanceAr: 'جبل قرب المدينة. موقع غزوة أحد.'),
  PlaceEntry(name: 'Al-Khandaq (Trench)',     nameAr: 'الخندق',                category: 'Battle Sites',     categoryAr: 'مواقع المعارك',  significance: 'Madinah\'s north approach. Site of the Battle of the Trench.', significanceAr: 'المدخل الشمالي للمدينة. موقع غزوة الخندق.'),
  PlaceEntry(name: 'Hudaybiyyah',             nameAr: 'الحديبية',              category: 'Sites of Events',  categoryAr: 'مواقع أحداث',    significance: 'Site of the famous treaty between the Muslims and Quraysh.', significanceAr: 'موقع الصلح المشهور بين المسلمين وقريش.'),
  PlaceEntry(name: 'Khaybar',                 nameAr: 'خيبر',                  category: 'Battle Sites',     categoryAr: 'مواقع المعارك',  significance: 'Jewish fortress complex north of Madinah. Conquered in 7 AH.', significanceAr: 'مجمع حصون يهودية شمال المدينة. فُتحت في السنة السابعة للهجرة.'),
  PlaceEntry(name: 'Ta\'if',                  nameAr: 'الطائف',                category: 'Cities of Events', categoryAr: 'مدن الأحداث',    significance: 'City southeast of Makkah. The Prophet ﷺ was rejected here but showed extraordinary patience.', significanceAr: 'مدينة جنوب شرق مكة. رُفض فيها النبي ﷺ لكنه أظهر صبرًا عظيمًا.'),
  PlaceEntry(name: 'Abyssinia (Ethiopia)',    nameAr: 'الحبشة (إثيوبيا)',      category: 'Migration Sites',  categoryAr: 'مواقع الهجرة',   significance: 'Christian kingdom where early Muslims took refuge under the just King Negus.', significanceAr: 'مملكة مسيحية لجأ إليها المسلمون الأوائل تحت حكم الملك النجاشي العادل.'),
  PlaceEntry(name: 'Jerusalem (Al-Quds)',     nameAr: 'القدس',                 category: 'Sacred Cities',    categoryAr: 'مدن مقدسة',      significance: 'Starting point of the Isra. Third holiest city in Islam.', significanceAr: 'نقطة انطلاق الإسراء. ثالث أقدس مدينة في الإسلام.'),
];
