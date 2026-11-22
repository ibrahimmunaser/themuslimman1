/// "Du'a for loved ones": the righteous-child reminder.
///
/// Hadith (Sahih Muslim): when a person dies their deeds end except three —
/// ongoing charity, beneficial knowledge, and a righteous child who prays
/// for them. This feature reminds the user to make du'a for the people they
/// choose, at the times they choose.
///
/// Everything here is on-device only: the people the user lists never leave
/// the phone.
library;

/// When, relative to the day's prayers, a du'a reminder may fire. The user
/// picks any combination; each selected window fires once per day.
enum DuaWindow {
  /// Midway between Fajr and Dhuhr.
  morning('Morning', 'Between Fajr and Dhuhr'),

  /// Midway between Dhuhr and Asr.
  afternoon('Afternoon', 'Between Dhuhr and Asr'),

  /// 40 minutes before Maghrib — the last hour of the day is a blessed time
  /// for du'a (especially on Friday).
  beforeMaghrib('Before Maghrib', 'A blessed time for du\'a'),

  /// Midway between Maghrib and Isha.
  evening('Evening', 'Between Maghrib and Isha'),

  /// The start of the last third of the night.
  lastThird('Last third of the night', 'When du\'a is most likely answered');

  final String label;
  final String description;

  const DuaWindow(this.label, this.description);

  static DuaWindow? fromName(String? name) {
    for (final w in DuaWindow.values) {
      if (w.name == name) return w;
    }
    return null;
  }
}

/// How the person is related to the user. Only used for labels and to pick
/// sensible default wording (he / she).
enum DuaRelation {
  mother('Mother', isFemale: true),
  father('Father', isFemale: false),
  grandmother('Grandmother', isFemale: true),
  grandfather('Grandfather', isFemale: false),
  sister('Sister', isFemale: true),
  brother('Brother', isFemale: false),
  wife('Wife', isFemale: true),
  husband('Husband', isFemale: false),
  daughter('Daughter', isFemale: true),
  son('Son', isFemale: false),
  friend('Friend', isFemale: null),
  other('Someone else', isFemale: null);

  final String label;

  /// The implied gender, or null when the user must choose.
  final bool? isFemale;

  const DuaRelation(this.label, {required this.isFemale});

  bool get isParent => this == mother || this == father;

  static DuaRelation fromName(String? name) {
    for (final r in DuaRelation.values) {
      if (r.name == name) return r;
    }
    return DuaRelation.other;
  }
}

/// Someone the user wants to be reminded to make du'a for.
class DuaPerson {
  final String id;
  final String name;
  final DuaRelation relation;
  final bool isFemale;

  /// Whether this person has passed away. Purely changes the wording of the
  /// du'a shown (forgiveness and mercy for the deceased; guidance and
  /// protection for the living).
  final bool deceased;

  const DuaPerson({
    required this.id,
    required this.name,
    required this.relation,
    required this.isFemale,
    required this.deceased,
  });

  /// What to call them in a notification or on the card.
  String get displayName {
    final n = name.trim();
    return n.isEmpty ? relation.label : n;
  }

  DuaPerson copyWith({
    String? name,
    DuaRelation? relation,
    bool? isFemale,
    bool? deceased,
  }) {
    return DuaPerson(
      id: id,
      name: name ?? this.name,
      relation: relation ?? this.relation,
      isFemale: isFemale ?? this.isFemale,
      deceased: deceased ?? this.deceased,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'relation': relation.name,
    'isFemale': isFemale,
    'deceased': deceased,
  };

  factory DuaPerson.fromJson(Map<String, dynamic> json) {
    final relation = DuaRelation.fromName(json['relation'] as String?);
    return DuaPerson(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      relation: relation,
      isFemale: json['isFemale'] as bool? ?? relation.isFemale ?? false,
      deceased: json['deceased'] as bool? ?? false,
    );
  }
}

/// One du'a shown on the card.
class DuaText {
  final String arabic;

  /// A Latin-letter phonetic rendering of [arabic], shown as a reading aid.
  /// This is the same regardless of the app's display language — it's a
  /// pronunciation guide, not a translation.
  final String transliteration;
  final String translation;

  /// Where it comes from, e.g. "Sahih Muslim" or "Qur'an 17:24".
  final String source;

  const DuaText({
    required this.arabic,
    required this.transliteration,
    required this.translation,
    required this.source,
  });
}

/// Four du'as (in third person, gender-matched) suggested for a living
/// loved one. Index 0 is the original Sahih Muslim 2721 wording; the rest
/// add variety so the card doesn't say the same thing every day.
List<DuaText> _livingDuas(bool she) => [
  DuaText(
    arabic:
        she
            ? 'اللَّهُمَّ ارْزُقْهَا الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى'
            : 'اللَّهُمَّ ارْزُقْهُ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى',
    transliteration:
        she
            ? 'Allāhumma-rzuqhā al-hudā wa-t-tuqā wa-l-ʿafāfa wa-l-ghinā.'
            : 'Allāhumma-rzuqhu al-hudā wa-t-tuqā wa-l-ʿafāfa wa-l-ghinā.',
    translation:
        she
            ? 'O Allah, grant her guidance, piety, chastity, and contentment.'
            : 'O Allah, grant him guidance, piety, chastity, and '
                'contentment.',
    source: 'Sahih Muslim',
  ),
  DuaText(
    arabic:
        she
            ? 'اللَّهُمَّ آتِهَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِهَا عَذَابَ النَّارِ'
            : 'اللَّهُمَّ آتِهِ فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِهِ عَذَابَ النَّارِ',
    transliteration:
        she
            ? 'Allāhumma ātihā fī-d-dunyā ḥasanatan wa fī-l-ākhirati '
                'ḥasanatan wa qihā ʿadhāba-n-nār.'
            : 'Allāhumma ātihi fī-d-dunyā ḥasanatan wa fī-l-ākhirati '
                'ḥasanatan wa qihi ʿadhāba-n-nār.',
    translation:
        she
            ? 'O Allah, grant her good in this world and good in the '
                'Hereafter, and protect her from the punishment of the Fire.'
            : 'O Allah, grant him good in this world and good in the '
                'Hereafter, and protect him from the punishment of the '
                'Fire.',
    source: 'Qur\'an 2:201',
  ),
  DuaText(
    arabic:
        she
            ? 'اللَّهُمَّ إِنِّي أَسْأَلُكَ لَهَا الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ'
            : 'اللَّهُمَّ إِنِّي أَسْأَلُكَ لَهُ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ',
    transliteration:
        she
            ? 'Allāhumma innī asʾaluka lahā al-ʿāfiyata fī-d-dunyā '
                'wa-l-ākhirah.'
            : 'Allāhumma innī asʾaluka lahu al-ʿāfiyata fī-d-dunyā '
                'wa-l-ākhirah.',
    translation:
        she
            ? 'O Allah, I ask You for her well-being in this world and the '
                'Hereafter.'
            : 'O Allah, I ask You for his well-being in this world and the '
                'Hereafter.',
    source: 'Sunan Ibn Majah',
  ),
  DuaText(
    arabic:
        she
            ? 'اللَّهُمَّ اجْعَلْهَا قُرَّةَ عَيْنٍ وَاجْعَلْهَا مِنَ الْمُتَّقِينَ'
            : 'اللَّهُمَّ اجْعَلْهُ قُرَّةَ عَيْنٍ وَاجْعَلْهُ مِنَ الْمُتَّقِينَ',
    transliteration:
        she
            ? 'Allāhumma-jʿalhā qurrata ʿaynin wa-jʿalhā mina-l-muttaqīn.'
            : 'Allāhumma-jʿalhu qurrata ʿaynin wa-jʿalhu mina-l-muttaqīn.',
    translation:
        she
            ? 'O Allah, make her a comfort to the eyes, and make her among '
                'the righteous.'
            : 'O Allah, make him a comfort to the eyes, and make him among '
                'the righteous.',
    source: 'Qur\'an 25:74',
  ),
];

/// The relation-personalized forgiveness-and-mercy du'a — index 0 of
/// [_deceasedDuas]. Named relations (mother, father, brother, ...) use the
/// exact Arabic possessive for that relation (e.g. "my mother", "my son")
/// rather than a generic "him"/"her", per the wording in Sahih Muslim 963a,
/// personalized. [DuaRelation.friend] and [DuaRelation.other] fall back to
/// the plain, non-personalized hadith wording.
DuaText _personalizedForgiveness(DuaRelation relation, bool she) {
  switch (relation) {
    case DuaRelation.mother:
      return const DuaText(
        arabic: 'اللَّهُمَّ اغْفِرْ لِأُمِّي وَارْحَمْهَا',
        transliteration: 'Allāhumma ighfir li-ummī wa-rḥamhā.',
        translation: 'O Allah, forgive my mother and have mercy on her.',
        source: 'Sahih Muslim 963a',
      );
    case DuaRelation.father:
      return const DuaText(
        arabic: 'اللَّهُمَّ اغْفِرْ لِأَبِي وَارْحَمْهُ',
        transliteration: 'Allāhumma ighfir li-abī wa-rḥamhu.',
        translation: 'O Allah, forgive my father and have mercy on him.',
        source: 'Sahih Muslim 963a',
      );
    case DuaRelation.brother:
      return const DuaText(
        arabic: 'اللَّهُمَّ اغْفِرْ لِأَخِي وَارْحَمْهُ',
        transliteration: 'Allāhumma ighfir li-akhī wa-rḥamhu.',
        translation: 'O Allah, forgive my brother and have mercy on him.',
        source: 'Sahih Muslim 963a',
      );
    case DuaRelation.sister:
      return const DuaText(
        arabic: 'اللَّهُمَّ اغْفِرْ لِأُخْتِي وَارْحَمْهَا',
        transliteration: 'Allāhumma ighfir li-ukhtī wa-rḥamhā.',
        translation: 'O Allah, forgive my sister and have mercy on her.',
        source: 'Sahih Muslim 963a',
      );
    case DuaRelation.husband:
      return const DuaText(
        arabic: 'اللَّهُمَّ اغْفِرْ لِزَوْجِي وَارْحَمْهُ',
        transliteration: 'Allāhumma ighfir li-zawjī wa-rḥamhu.',
        translation: 'O Allah, forgive my husband and have mercy on him.',
        source: 'Sahih Muslim 963a',
      );
    case DuaRelation.wife:
      return const DuaText(
        arabic: 'اللَّهُمَّ اغْفِرْ لِزَوْجَتِي وَارْحَمْهَا',
        transliteration: 'Allāhumma ighfir li-zawjatī wa-rḥamhā.',
        translation: 'O Allah, forgive my wife and have mercy on her.',
        source: 'Sahih Muslim 963a',
      );
    case DuaRelation.son:
      return const DuaText(
        arabic: 'اللَّهُمَّ اغْفِرْ لِابْنِي وَارْحَمْهُ',
        transliteration: 'Allāhumma ighfir li-ibnī wa-rḥamhu.',
        translation: 'O Allah, forgive my son and have mercy on him.',
        source: 'Sahih Muslim 963a',
      );
    case DuaRelation.daughter:
      return const DuaText(
        arabic: 'اللَّهُمَّ اغْفِرْ لِابْنَتِي وَارْحَمْهَا',
        transliteration: 'Allāhumma ighfir li-ibnatī wa-rḥamhā.',
        translation: 'O Allah, forgive my daughter and have mercy on her.',
        source: 'Sahih Muslim 963a',
      );
    case DuaRelation.grandfather:
      return const DuaText(
        arabic: 'اللَّهُمَّ اغْفِرْ لِجَدِّي وَارْحَمْهُ',
        transliteration: 'Allāhumma ighfir li-jaddī wa-rḥamhu.',
        translation: 'O Allah, forgive my grandfather and have mercy on '
            'him.',
        source: 'Sahih Muslim 963a',
      );
    case DuaRelation.grandmother:
      return const DuaText(
        arabic: 'اللَّهُمَّ اغْفِرْ لِجَدَّتِي وَارْحَمْهَا',
        transliteration: 'Allāhumma ighfir li-jaddatī wa-rḥamhā.',
        translation: 'O Allah, forgive my grandmother and have mercy on '
            'her.',
        source: 'Sahih Muslim 963a',
      );
    case DuaRelation.friend:
      return she
          ? const DuaText(
            arabic: 'اللَّهُمَّ اغْفِرْ لِصَدِيقَتِي وَارْحَمْهَا',
            transliteration: 'Allāhumma ighfir li-ṣadīqatī wa-rḥamhā.',
            translation: 'O Allah, forgive my friend and have mercy on her.',
            source: 'Sahih Muslim 963a',
          )
          : const DuaText(
            arabic: 'اللَّهُمَّ اغْفِرْ لِصَدِيقِي وَارْحَمْهُ',
            transliteration: 'Allāhumma ighfir li-ṣadīqī wa-rḥamhu.',
            translation: 'O Allah, forgive my friend and have mercy on him.',
            source: 'Sahih Muslim 963a',
          );
    case DuaRelation.other:
      return she
          ? const DuaText(
            arabic: 'اللَّهُمَّ اغْفِرْ لَهَا وَارْحَمْهَا',
            transliteration: 'Allāhumma ighfir lahā wa-rḥamhā.',
            translation: 'O Allah, forgive her and have mercy on her.',
            source: 'Sahih Muslim 963a',
          )
          : const DuaText(
            arabic: 'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ',
            transliteration: 'Allāhumma ighfir lahu wa-rḥamhu.',
            translation: 'O Allah, forgive him and have mercy on him.',
            source: 'Sahih Muslim 963a',
          );
  }
}

/// Four du'as (in third person, gender-matched, and — for index 0 — relation
/// -personalized) suggested for a deceased loved one. Index 0 personalizes
/// the forgiveness-and-mercy request from Sahih Muslim 963a to the exact
/// relationship; index 1 is the Paradise / protection-from-the-grave
/// portion of the same hadith; indices 2-3 adapt the Prophet's ﷺ du'a for
/// Abu Salamah (Sahih Muslim 920a) so the card doesn't say the same thing
/// every day.
List<DuaText> _deceasedDuas(DuaRelation relation, bool she) => [
  _personalizedForgiveness(relation, she),
  DuaText(
    arabic:
        she
            ? 'اللَّهُمَّ أَدْخِلْهَا الْجَنَّةَ وَأَعِذْهَا مِنْ عَذَابِ الْقَبْرِ وَعَذَابِ النَّارِ'
            : 'اللَّهُمَّ أَدْخِلْهُ الْجَنَّةَ وَأَعِذْهُ مِنْ عَذَابِ الْقَبْرِ وَعَذَابِ النَّارِ',
    transliteration:
        she
            ? 'Allāhumma adkhilhā al-jannata wa-aʿidhhā min ʿadhābi-l-qabri '
                'wa-ʿadhābi-n-nār.'
            : 'Allāhumma adkhilhu al-jannata wa-aʿidhhu min ʿadhābi-l-qabri '
                'wa-ʿadhābi-n-nār.',
    translation:
        she
            ? 'O Allah, admit her into Paradise, and protect her from the '
                'punishment of the grave and the punishment of the Fire.'
            : 'O Allah, admit him into Paradise, and protect him from the '
                'punishment of the grave and the punishment of the Fire.',
    source: 'Sahih Muslim 963a',
  ),
  DuaText(
    arabic:
        she
            ? 'اللَّهُمَّ افْسَحْ لَهَا فِي قَبْرِهَا وَنَوِّرْ لَهَا فِيهِ'
            : 'اللَّهُمَّ افْسَحْ لَهُ فِي قَبْرِهِ وَنَوِّرْ لَهُ فِيهِ',
    transliteration:
        she
            ? 'Allāhumma-fsaḥ lahā fī qabrihā wa-nawwir lahā fīhi.'
            : 'Allāhumma-fsaḥ lahu fī qabrihi wa-nawwir lahu fīhi.',
    translation:
        she
            ? 'O Allah, make her grave spacious and illuminate it for her.'
            : 'O Allah, make his grave spacious and illuminate it for him.',
    source: 'Sahih Muslim 920a',
  ),
  DuaText(
    arabic:
        she
            ? 'اللَّهُمَّ ارْفَعْ دَرَجَتَهَا فِي الْمَهْدِيِّينَ'
            : 'اللَّهُمَّ ارْفَعْ دَرَجَتَهُ فِي الْمَهْدِيِّينَ',
    transliteration:
        she
            ? 'Allāhumma-rfaʿ darajatahā fī-l-mahdiyyīn.'
            : 'Allāhumma-rfaʿ darajatahu fī-l-mahdiyyīn.',
    translation:
        she
            ? 'O Allah, raise her rank among the rightly guided.'
            : 'O Allah, raise his rank among the rightly guided.',
    source: 'Sahih Muslim 920a',
  ),
];

/// The du'a(s) shown for [person] (or a general one when null).
///
/// - Deceased / living: one du'a picked from a 4-option list matched to the
///   person's status and gender (see [_deceasedDuas] / [_livingDuas]).
///   [dayIndex] selects which — pass a day counter to rotate day to day, or
///   leave the default to always get the first (original) wording.
/// - Parents (living or deceased): additionally the Qur'anic du'a of 17:24.
///
/// These wordings should be reviewed by a scholar before release.
List<DuaText> duaTextsFor(DuaPerson? person, {int dayIndex = 0}) {
  if (person == null) {
    return const [
      DuaText(
        arabic: 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',
        transliteration:
            'Rabbanā-ghfir lī wa-li-wālidayya wa-li-l-muʾminīna yawma '
            'yaqūmu-l-ḥisāb.',
        translation:
            'Our Lord, forgive me, my parents, and the believers on the Day '
            'the account is established.',
        source: 'Qur\'an 14:41',
      ),
    ];
  }

  final out = <DuaText>[];
  final she = person.isFemale;
  final list =
      person.deceased
          ? _deceasedDuas(person.relation, she)
          : _livingDuas(she);
  out.add(list[dayIndex.abs() % list.length]);

  if (person.relation.isParent) {
    out.add(
      const DuaText(
        arabic: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
        transliteration: 'Rabbi irḥamhumā kamā rabbayānī ṣaghīrā.',
        translation:
            'My Lord, have mercy on them as they raised me when I was small.',
        source: 'Qur\'an 17:24',
      ),
    );
  }
  return out;
}
