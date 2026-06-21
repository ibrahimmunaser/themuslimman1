// Reference Library data — mirrors the web app's reference sections

class ReferenceSection {
  final String id;
  final String title;
  final String description;
  const ReferenceSection({required this.id, required this.title, required this.description});
}

const kReferenceSections = [
  ReferenceSection(id: 'family-household',  title: 'Family & Household',        description: 'Wives, children, and household of the Prophet ﷺ'),
  ReferenceSection(id: 'timeline',          title: 'Timeline of the Seerah',    description: 'Chronological timeline of major events'),
  ReferenceSection(id: 'key-people',        title: 'Key People',                description: 'Companions, leaders, and figures of the Seerah'),
  ReferenceSection(id: 'tribes-lineage',    title: 'Tribes and Lineage',        description: 'The major Arab tribes and the Prophet\'s ﷺ lineage'),
  ReferenceSection(id: 'battles',           title: 'Battles and Expeditions',   description: 'Major battles, campaigns, and expeditions'),
  ReferenceSection(id: 'miracles',          title: 'Miracles and Signs',        description: 'Verified miracles from Qur\'an and Sahih hadith'),
  ReferenceSection(id: 'important-terms',   title: 'Important Terms',           description: 'A glossary of Arabic and historical terms'),
  ReferenceSection(id: 'places-maps',       title: 'Places and Maps',           description: 'Key cities, routes, and locations in the Seerah'),
];

// ── Family & Household ────────────────────────────────────────────────────────

class WifeEntry {
  final String name;
  final bool hasChildren;
  final String notes;
  const WifeEntry({required this.name, required this.hasChildren, required this.notes});
}

const kWives = [
  WifeEntry(name: 'Khadijah bint Khuwaylid',   hasChildren: true,  notes: 'Mother of all his children except Ibrahim. First person to believe in him.'),
  WifeEntry(name: "Sawdah bint Zam'ah",         hasChildren: false, notes: 'One of the Mothers of the Believers. Showed great loyalty.'),
  WifeEntry(name: 'Aishah bint Abi Bakr',       hasChildren: false, notes: 'Major narrator of hadith. Daughter of Abu Bakr al-Siddiq.'),
  WifeEntry(name: 'Hafsah bint Umar',           hasChildren: false, notes: 'Daughter of Umar ibn al-Khattab. Guardian of an early copy of the Qur\'an.'),
  WifeEntry(name: 'Zaynab bint Khuzaymah',      hasChildren: false, notes: 'Known as "Mother of the Poor" for her generosity.'),
  WifeEntry(name: 'Umm Salamah',                hasChildren: false, notes: 'Known for wisdom and sound judgment.'),
  WifeEntry(name: 'Zaynab bint Jahsh',          hasChildren: false, notes: 'Her marriage is mentioned in the Qur\'an.'),
  WifeEntry(name: "Juwayriyah bint al-Harith",  hasChildren: false, notes: 'From Banu al-Mustaliq. Her marriage freed many captives.'),
  WifeEntry(name: 'Umm Habibah',                hasChildren: false, notes: 'Daughter of Abu Sufyan. Remained firm in faith despite early hardship.'),
  WifeEntry(name: "Safiyyah bint Huyayy",       hasChildren: false, notes: 'From Banu al-Nadir. From a noble Jewish family.'),
  WifeEntry(name: "Maymunah bint al-Harith",    hasChildren: false, notes: 'The last wife the Prophet ﷺ married.'),
];

class ChildEntry {
  final String name;
  final String mother;
  final String notes;
  const ChildEntry({required this.name, required this.mother, required this.notes});
}

const kChildren = [
  ChildEntry(name: 'Al-Qasim',    mother: 'Khadijah',              notes: 'Died young.'),
  ChildEntry(name: 'Zaynab',      mother: 'Khadijah',              notes: 'Daughter.'),
  ChildEntry(name: 'Ruqayyah',    mother: 'Khadijah',              notes: 'Daughter. Married Uthman ibn Affan.'),
  ChildEntry(name: 'Umm Kulthum', mother: 'Khadijah',              notes: 'Daughter. Later married Uthman ibn Affan.'),
  ChildEntry(name: 'Fatimah',     mother: 'Khadijah',              notes: 'The Prophet\'s ﷺ lineage continued through her.'),
  ChildEntry(name: 'Abdullah',    mother: 'Khadijah',              notes: 'Also known as al-Tayyib and al-Tahir.'),
  ChildEntry(name: 'Ibrahim',     mother: 'Mariyah al-Qibtiyyah',  notes: 'Died in childhood.'),
];

// ── Timeline ──────────────────────────────────────────────────────────────────

class TimelineEvent {
  final String date;
  final String title;
  final String description;
  const TimelineEvent({required this.date, required this.title, required this.description});
}

const kTimeline = [
  TimelineEvent(date: '570 CE',          title: 'Birth in Makkah',             description: 'The Prophet Muhammad ﷺ was born in Makkah into the noble clan of Banu Hashim.'),
  TimelineEvent(date: '576 CE',          title: 'Orphaned at a Young Age',     description: 'After losing his father before birth, his mother passed when he was around six. He was raised by his grandfather, then uncle.'),
  TimelineEvent(date: '595 CE',          title: 'Marriage to Khadijah ؓ',      description: 'He married Khadijah ؓ, the first person to believe in him and his greatest supporter.'),
  TimelineEvent(date: '610 CE',          title: 'First Revelation',            description: 'The first revelation came through Jibreel ؑ in the Cave of Hira, beginning his Prophethood.'),
  TimelineEvent(date: '613 CE',          title: 'Public Call Begins',          description: 'After private dawah, the Prophet ﷺ began calling people publicly to worship Allah alone.'),
  TimelineEvent(date: '615 CE',          title: 'Migration to Abyssinia',      description: 'Some early Muslims migrated to Abyssinia to escape persecution and preserve their religion.'),
  TimelineEvent(date: '619 CE',          title: 'The Year of Sorrow',          description: 'Khadijah ؓ and Abu Talib both passed away — two of his strongest supporters.'),
  TimelineEvent(date: '620–621 CE',      title: 'Isra and Miʿraj',             description: 'The Night Journey and Ascension. The command for the five daily prayers was given.'),
  TimelineEvent(date: '622 CE / 1 AH',   title: 'Hijrah to Madinah',           description: 'The Prophet ﷺ migrated to Madinah. This event marks the start of the Islamic calendar.'),
  TimelineEvent(date: '624 CE / 2 AH',   title: 'Battle of Badr',              description: 'A decisive Muslim victory. A major turning point for the early Muslim community.'),
  TimelineEvent(date: '625 CE / 3 AH',   title: 'Battle of Uhud',              description: 'A painful setback. Lessons about obedience, patience, and discipline.'),
  TimelineEvent(date: '627 CE / 5 AH',   title: 'Battle of the Trench',        description: 'The Muslims defended Madinah during a major siege. Allah protected the believers.'),
  TimelineEvent(date: '628 CE / 6 AH',   title: 'Treaty of Hudaybiyyah',       description: 'A treaty with Quraysh that seemed difficult at first — but became a major opening for Islam.'),
  TimelineEvent(date: '630 CE / 8 AH',   title: 'Conquest of Makkah',          description: 'The Prophet ﷺ entered Makkah victorious and forgave those who had wronged him.'),
  TimelineEvent(date: '630 CE / 8 AH',   title: 'Hunayn and Ta\'if',           description: 'After Makkah, the Muslims faced new tests. Arabian tribes continued entering Islam.'),
  TimelineEvent(date: '631 CE / 9 AH',   title: 'Year of Delegations',         description: 'Tribes from across Arabia came to Madinah accepting Islam.'),
  TimelineEvent(date: '632 CE / 10 AH',  title: 'Farewell Hajj',               description: 'The Prophet ﷺ performed his final Hajj and delivered his famous farewell sermon.'),
  TimelineEvent(date: '632 CE / 11 AH',  title: 'Passing of the Prophet ﷺ',   description: 'The Prophet ﷺ passed away in Madinah after completing his mission.'),
];

// ── Battles and Expeditions ───────────────────────────────────────────────────

class BattleEvent {
  final String date;
  final String name;
  final String type;
  final String outcome;
  final String significance;
  const BattleEvent({required this.date, required this.name, required this.type, required this.outcome, required this.significance});
}

const kBattles = [
  BattleEvent(date: '2 AH / 624 CE',  name: 'Battle of Badr',           type: 'Major Battle',    outcome: 'Muslim Victory',     significance: 'First major military victory. Proved the Muslims could defend themselves.'),
  BattleEvent(date: '3 AH / 625 CE',  name: 'Battle of Uhud',           type: 'Major Battle',    outcome: 'Setback',            significance: 'A test of patience after archers left their positions. Hamzah ؓ was martyred.'),
  BattleEvent(date: '5 AH / 627 CE',  name: 'Battle of the Trench',     type: 'Major Battle',    outcome: 'Muslim Defence',     significance: 'Madinah was besieged. The trench strategy kept the enemy out for weeks.'),
  BattleEvent(date: '6 AH / 628 CE',  name: 'Treaty of Hudaybiyyah',    type: 'Treaty',          outcome: 'Peace Agreement',    significance: 'Seemed unfair but opened the door to mass conversions across Arabia.'),
  BattleEvent(date: '7 AH / 629 CE',  name: 'Battle of Khaybar',        type: 'Campaign',        outcome: 'Muslim Victory',     significance: 'Jewish strongholds north of Madinah were taken. Generous terms given.'),
  BattleEvent(date: '7 AH / 629 CE',  name: 'Battle of Mu\'tah',        type: 'Campaign',        outcome: 'Tactical Withdrawal',significance: 'First clash with Byzantine forces. Zayd ibn Harithah, Ja\'far, and ibn Rawahah ؓ were martyred.'),
  BattleEvent(date: '8 AH / 630 CE',  name: 'Conquest of Makkah',       type: 'Campaign',        outcome: 'Bloodless Victory',  significance: 'The Prophet ﷺ entered Makkah with 10,000 — and forgave almost everyone.'),
  BattleEvent(date: '8 AH / 630 CE',  name: 'Battle of Hunayn',         type: 'Major Battle',    outcome: 'Muslim Victory',     significance: 'Initial panic gave way to rally. Allah sent sakina and unseen support.'),
  BattleEvent(date: '9 AH / 631 CE',  name: 'Expedition of Tabuk',      type: 'Expedition',      outcome: 'Peaceful Return',    significance: 'A test of commitment. The hypocrites revealed themselves by staying behind.'),
];

// ── Miracles and Signs ────────────────────────────────────────────────────────

class MiracleEntry {
  final String source;
  final String title;
  final String description;
  const MiracleEntry({required this.source, required this.title, required this.description});
}

const kMiracles = [
  MiracleEntry(source: 'Qur\'an',          title: 'The Qur\'an Itself',            description: 'The Qur\'an is the Prophet\'s ﷺ greatest miracle — inimitable in language, structure, prophecy, and knowledge. It remains unchanged since revelation. (Al-Baqarah 2:23)'),
  MiracleEntry(source: 'Qur\'an',          title: 'Splitting of the Moon',         description: 'Allah split the moon as a sign for the Quraysh. (Al-Qamar 54:1-2)'),
  MiracleEntry(source: 'Qur\'an',          title: 'The Isra and Miʿraj',           description: 'The Night Journey from Makkah to Jerusalem and ascension through the heavens. (Al-Isra 17:1)'),
  MiracleEntry(source: 'Sahih al-Bukhari', title: 'Water Flowing from His Fingers', description: 'At Hudaybiyyah, water flowed from between his fingers, enough for 1,500 companions to drink. (Bukhari 3576)'),
  MiracleEntry(source: 'Sahih al-Bukhari', title: 'Food Multiplied at Jabir\'s Home', description: 'A small amount of food fed the entire army at the Battle of the Trench. (Bukhari 4101)'),
  MiracleEntry(source: 'Sahih al-Bukhari', title: 'The Tree Trunk Cried',           description: 'The date palm trunk wept audibly when the Prophet ﷺ moved to the minbar. (Bukhari 3583)'),
  MiracleEntry(source: 'Sahih al-Bukhari', title: 'Spitting into the Eye of Ali ؓ', description: 'Ali ؓ was healed of severe eye pain by the Prophet\'s ﷺ saliva at Khaybar. (Bukhari 2942)'),
  MiracleEntry(source: 'Sahih Muslim',     title: 'Stones Glorified Allah in His Hand', description: 'Pebbles in the Prophet\'s ﷺ palm were heard glorifying Allah. (Muslim 2279)'),
  MiracleEntry(source: 'Sahih Muslim',     title: 'Prediction of the Death of Najashi', description: 'The Prophet ﷺ announced the death of the Negus on the very day it occurred in Abyssinia. (Muslim 953)'),
  MiracleEntry(source: 'Qur\'an',          title: 'Prophecy of Roman Victory',     description: 'The Qur\'an predicted the Roman victory over Persia within a few years — fulfilled exactly. (Ar-Rum 30:2-4)'),
];

// ── Important Terms ───────────────────────────────────────────────────────────

class TermEntry {
  final String arabic;
  final String transliteration;
  final String category;
  final String definition;
  const TermEntry({required this.arabic, required this.transliteration, required this.category, required this.definition});
}

const kTerms = [
  TermEntry(arabic: 'سيرة',       transliteration: 'Seerah',         category: 'Study',         definition: 'The biography of the Prophet Muhammad ﷺ — his life, actions, and character.'),
  TermEntry(arabic: 'نبي',        transliteration: 'Nabi',           category: 'Prophethood',   definition: 'A Prophet — one who receives revelation from Allah.'),
  TermEntry(arabic: 'رسول',       transliteration: 'Rasul',          category: 'Prophethood',   definition: 'A Messenger — a Prophet sent with a message and a law for a people.'),
  TermEntry(arabic: 'وحي',        transliteration: 'Wahy',           category: 'Revelation',    definition: 'Divine revelation — the communication from Allah to His Prophet.'),
  TermEntry(arabic: 'صحابة',      transliteration: 'Sahabah',        category: 'People',        definition: 'The Companions — those who met the Prophet ﷺ, believed in him, and died as Muslims.'),
  TermEntry(arabic: 'هجرة',       transliteration: 'Hijrah',         category: 'Events',        definition: 'The migration of the Prophet ﷺ and his Companions from Makkah to Madinah in 622 CE.'),
  TermEntry(arabic: 'جاهلية',     transliteration: 'Jahiliyyah',     category: 'History',       definition: 'The Age of Ignorance — the pre-Islamic era in Arabia characterized by idol worship and tribal violence.'),
  TermEntry(arabic: 'قريش',       transliteration: 'Quraysh',        category: 'Tribes',        definition: 'The dominant tribe of Makkah. The Prophet ﷺ was from the Quraysh, specifically the Banu Hashim clan.'),
  TermEntry(arabic: 'كعبة',       transliteration: "Ka'bah",         category: 'Places',        definition: 'The cubic structure in Makkah built by Ibrahim ؑ and Ismail ؑ. The qibla of the Muslims.'),
  TermEntry(arabic: 'مسجد',       transliteration: 'Masjid',         category: 'Places',        definition: 'A mosque — a place of prayer and worship in Islam.'),
  TermEntry(arabic: 'سنة',        transliteration: 'Sunnah',         category: 'Study',         definition: 'The actions, sayings, and approvals of the Prophet ﷺ. The second primary source of Islamic law.'),
  TermEntry(arabic: 'حديث',       transliteration: 'Hadith',         category: 'Study',         definition: 'A narration of the Prophet\'s ﷺ words, actions, or approvals.'),
  TermEntry(arabic: 'إسلام',      transliteration: 'Islam',          category: 'Religion',      definition: 'Complete submission to the will of Allah — the religion revealed to Muhammad ﷺ.'),
  TermEntry(arabic: 'ايمان',      transliteration: 'Iman',           category: 'Religion',      definition: 'Faith — belief in Allah, His angels, His books, His messengers, the Last Day, and divine decree.'),
  TermEntry(arabic: 'دعوة',       transliteration: "Da'wah",         category: 'Events',        definition: 'The call to Islam — inviting others to the faith through speech, example, and wisdom.'),
  TermEntry(arabic: 'شهادة',      transliteration: 'Shahada',        category: 'Religion',      definition: 'The declaration of faith: "There is no god but Allah, and Muhammad is the Messenger of Allah."'),
  TermEntry(arabic: 'غزوة',       transliteration: 'Ghazwah',        category: 'Military',      definition: 'A military expedition in which the Prophet ﷺ personally participated.'),
  TermEntry(arabic: 'سرية',       transliteration: 'Sariyyah',       category: 'Military',      definition: 'A military expedition sent by the Prophet ﷺ but which he did not personally join.'),
  TermEntry(arabic: 'أنصار',      transliteration: 'Ansar',          category: 'People',        definition: 'The Helpers — the Muslims of Madinah who welcomed and supported the Meccan emigrants.'),
  TermEntry(arabic: 'مهاجرون',    transliteration: 'Muhajirun',      category: 'People',        definition: 'The Emigrants — Muslims who migrated from Makkah to Madinah for the sake of Allah.'),
];

// ── Key People ────────────────────────────────────────────────────────────────

class PersonEntry {
  final String name;
  final String category;
  final String role;
  final String description;
  const PersonEntry({required this.name, required this.category, required this.role, required this.description});
}

const kKeyPeople = [
  PersonEntry(name: 'Abu Bakr al-Siddiq ؓ',       category: 'The Ten Given Glad Tidings', role: 'First Caliph',                      description: 'The closest companion of the Prophet ﷺ and first Caliph after his passing.'),
  PersonEntry(name: 'Umar ibn al-Khattab ؓ',       category: 'The Ten Given Glad Tidings', role: 'Second Caliph',                     description: 'Known for his justice, strength, and decisive leadership. Second Caliph.'),
  PersonEntry(name: 'Uthman ibn Affan ؓ',          category: 'The Ten Given Glad Tidings', role: 'Third Caliph',                      description: 'Married two daughters of the Prophet ﷺ. Compiled the Mushaf.'),
  PersonEntry(name: 'Ali ibn Abi Talib ؓ',         category: 'The Ten Given Glad Tidings', role: 'Fourth Caliph',                     description: 'The Prophet\'s cousin and son-in-law. Husband of Fatimah ؓ.'),
  PersonEntry(name: 'Talha ibn Ubaydullah ؓ',      category: 'The Ten Given Glad Tidings', role: 'Companion and warrior',             description: 'Protected the Prophet ﷺ with his hand at Uhud.'),
  PersonEntry(name: 'al-Zubayr ibn al-Awwam ؓ',   category: 'The Ten Given Glad Tidings', role: 'Companion',                         description: 'Called the disciple of the Prophet ﷺ. Among the earliest Muslims.'),
  PersonEntry(name: 'Abdur Rahman ibn Awf ؓ',      category: 'The Ten Given Glad Tidings', role: 'Companion and scholar',             description: 'Wealthy merchant known for generosity and sacrifice.'),
  PersonEntry(name: "Sa'd ibn Abi Waqqas ؓ",       category: 'The Ten Given Glad Tidings', role: 'Companion',                         description: 'The first to shoot an arrow in the cause of Islam.'),
  PersonEntry(name: 'Said ibn Zayd ؓ',             category: 'The Ten Given Glad Tidings', role: 'Companion',                         description: 'Among the earliest believers and the glad tidings ten.'),
  PersonEntry(name: 'Abu Ubayda ibn al-Jarrah ؓ',  category: 'The Ten Given Glad Tidings', role: 'Trustee of the Ummah',              description: 'Called "the Trustee of this Ummah" by the Prophet ﷺ.'),
  PersonEntry(name: 'Khadijah bint Khuwaylid ؓ',   category: 'Mothers of the Believers',   role: 'First Wife of the Prophet ﷺ',      description: 'First to believe in the Prophet ﷺ. His greatest supporter.'),
  PersonEntry(name: 'Aishah bint Abi Bakr ؓ',      category: 'Mothers of the Believers',   role: 'Wife and Scholar',                  description: 'Narrated thousands of hadith. One of the most knowledgeable women of the Ummah.'),
  PersonEntry(name: 'Fatimah al-Zahra ؓ',          category: 'Family of the Prophet ﷺ',    role: 'Daughter of the Prophet ﷺ',        description: 'The Prophet\'s beloved daughter. Wife of Ali ؓ. Mother of Hasan and Husayn.'),
  PersonEntry(name: 'Hamzah ibn Abd al-Muttalib ؓ', category: 'Family of the Prophet ﷺ',   role: 'Uncle and Companion',               description: 'The Lion of Allah. Embraced Islam and was martyred at Uhud.'),
  PersonEntry(name: 'Al-Abbas ibn Abd al-Muttalib ؓ', category: 'Family of the Prophet ﷺ', role: 'Uncle and Companion',               description: 'The Prophet\'s uncle. Became Muslim and was honored greatly.'),
  PersonEntry(name: 'Bilal ibn Rabah ؓ',            category: 'Early Converts',             role: 'First Muadhdhin',                   description: 'Freed slave from Abyssinia. First caller to prayer in Islam.'),
  PersonEntry(name: 'Sumayya bint Khayyat ؓ',       category: 'Early Converts',             role: 'First Martyr in Islam',             description: 'The first martyr in Islam. Killed for refusing to abandon her faith.'),
  PersonEntry(name: "Mus'ab ibn Umayr ؓ",           category: 'Early Converts',             role: 'Ambassador to Madinah',             description: 'Sent as the first teacher to Madinah before the Hijrah.'),
  PersonEntry(name: 'Abu Sufyan ibn Harb ؓ',        category: 'Later Companions',           role: 'Qurayshi Leader turned Companion',   description: 'Long-time opponent of Islam who embraced the faith at the Conquest of Makkah.'),
  PersonEntry(name: 'Khalid ibn al-Walid ؓ',        category: 'Military Commanders',        role: 'Commander of the Army',             description: 'The Sword of Allah. Undefeated general who accepted Islam before Makkah\'s conquest.'),
];

// ── Places ────────────────────────────────────────────────────────────────────

class PlaceEntry {
  final String name;
  final String category;
  final String significance;
  const PlaceEntry({required this.name, required this.category, required this.significance});
}

const kPlaces = [
  PlaceEntry(name: 'Makkah al-Mukarramah',    category: 'Sacred Cities',    significance: 'Birthplace of the Prophet ﷺ and site of the Ka\'bah. The holiest city in Islam.'),
  PlaceEntry(name: 'Madinah al-Munawwarah',   category: 'Sacred Cities',    significance: 'City of the Prophet ﷺ. His final resting place. Second holiest city in Islam.'),
  PlaceEntry(name: 'Al-Masjid al-Haram',      category: 'Sacred Mosques',   significance: 'The Grand Mosque in Makkah. Contains the Ka\'bah, the Black Stone, and Zamzam.'),
  PlaceEntry(name: 'Al-Masjid al-Nabawi',     category: 'Sacred Mosques',   significance: 'The Prophet\'s Mosque in Madinah. Built by the Prophet ﷺ upon his arrival.'),
  PlaceEntry(name: 'Cave of Hira',            category: 'Sites of Events',  significance: 'Where the first revelation was received. Located on Jabal al-Nur above Makkah.'),
  PlaceEntry(name: 'Cave of Thawr',           category: 'Sites of Events',  significance: 'Where the Prophet ﷺ and Abu Bakr hid for three nights during the Hijrah.'),
  PlaceEntry(name: 'Mount Arafat',            category: 'Hajj Sites',       significance: 'Site of the farewell sermon. Standing here is the pillar of Hajj.'),
  PlaceEntry(name: 'Badr',                    category: 'Battle Sites',     significance: 'Site of the first major battle. A valley between Makkah and Madinah.'),
  PlaceEntry(name: 'Uhud',                    category: 'Battle Sites',     significance: 'Mountain near Madinah. Site of the Battle of Uhud.'),
  PlaceEntry(name: 'Al-Khandaq (Trench)',     category: 'Battle Sites',     significance: 'Madinah\'s north approach. Site of the Battle of the Trench.'),
  PlaceEntry(name: 'Hudaybiyyah',             category: 'Sites of Events',  significance: 'Site of the famous treaty between the Muslims and Quraysh.'),
  PlaceEntry(name: 'Khaybar',                 category: 'Battle Sites',     significance: 'Jewish fortress complex north of Madinah. Conquered in 7 AH.'),
  PlaceEntry(name: 'Ta\'if',                  category: 'Cities of Events', significance: 'City southeast of Makkah. The Prophet ﷺ was rejected here but showed extraordinary patience.'),
  PlaceEntry(name: 'Abyssinia (Ethiopia)',    category: 'Migration Sites',  significance: 'Christian kingdom where early Muslims took refuge under the just King Negus.'),
  PlaceEntry(name: 'Jerusalem (Al-Quds)',     category: 'Sacred Cities',    significance: 'Starting point of the Isra. Third holiest city in Islam.'),
];
