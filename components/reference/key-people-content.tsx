"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Users, Info } from "lucide-react";

interface Person {
  name: string;
  category: string;
  role: string;
  description: string;
}

const PEOPLE_DATA: Person[] = [
  { name: "Khadijah bint Khuwaylid", category: "Mothers of the Believers", role: "First wife of the Prophet ﷺ", description: "The first person to believe in the Prophet ﷺ and one of his greatest supporters." },
  { name: "Aisha bint Abi Bakr", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ and scholar", description: "A major narrator of hadith and one of the most knowledgeable women of the Ummah." },
  { name: "Sawdah bint Zam'ah", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "One of the early Muslim women who showed loyalty and patience during hardship." },
  { name: "Hafsah bint Umar", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "Daughter of Umar ibn al-Khattab and a guardian of an early written copy of the Qur'an." },
  { name: "Umm Salamah Hind bint Abi Umayyah", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "Known for wisdom, patience, and strong judgment during difficult moments." },
  { name: "Zaynab bint Jahsh", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "Known for generosity and her important role in the Madinan period." },
  { name: "Juwayriyah bint al-Harith", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "Her marriage to the Prophet ﷺ brought blessing and freedom to many from her tribe." },
  { name: "Umm Habibah Ramlah bint Abi Sufyan", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "A believing woman who remained firm despite her father initially opposing Islam." },
  { name: "Safiyyah bint Huyayy", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "From a noble Jewish family of Madinah and later honored as a Mother of the Believers." },
  { name: "Maymunah bint al-Harith", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "One of the final women the Prophet ﷺ married." },
  { name: "Zaynab bint Khuzaymah", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "Known as the \"Mother of the Poor\" because of her care for the needy." },
  { name: "Maria al-Qibtiyyah", category: "Family of the Prophet ﷺ", role: "Mother of Ibrahim", description: "She was gifted to the Prophet ﷺ and bore his son Ibrahim." },
  { name: "Fatimah bint Muhammad", category: "Family of the Prophet ﷺ", role: "Daughter of the Prophet ﷺ", description: "Beloved daughter of the Prophet ﷺ and wife of Ali ibn Abi Talib." },
  { name: "Zaynab bint Muhammad", category: "Family of the Prophet ﷺ", role: "Daughter of the Prophet ﷺ", description: "One of the daughters of the Prophet ﷺ who endured hardship for her faith." },
  { name: "Ruqayyah bint Muhammad", category: "Family of the Prophet ﷺ", role: "Daughter of the Prophet ﷺ", description: "Wife of Uthman ibn Affan and among those connected to the early migrations." },
  { name: "Umm Kulthum bint Muhammad", category: "Family of the Prophet ﷺ", role: "Daughter of the Prophet ﷺ", description: "Later married Uthman ibn Affan after the passing of Ruqayyah." },
  { name: "Al-Qasim ibn Muhammad", category: "Family of the Prophet ﷺ", role: "Son of the Prophet ﷺ", description: "A son of the Prophet ﷺ who passed away in childhood." },
  { name: "Abdullah ibn Muhammad", category: "Family of the Prophet ﷺ", role: "Son of the Prophet ﷺ", description: "A son of the Prophet ﷺ who passed away young." },
  { name: "Ibrahim ibn Muhammad", category: "Family of the Prophet ﷺ", role: "Son of the Prophet ﷺ", description: "The young son of the Prophet ﷺ and Maria al-Qibtiyyah." },
  { name: "Abu Bakr al-Siddiq", category: "Ten Promised Paradise", role: "Closest companion and first caliph", description: "The Prophet's ﷺ closest companion, supporter during the Hijrah, and first caliph." },
  { name: "Umar ibn al-Khattab", category: "Ten Promised Paradise", role: "Major companion and second caliph", description: "His Islam strengthened the Muslims and his leadership shaped the early Ummah." },
  { name: "Uthman ibn Affan", category: "Ten Promised Paradise", role: "Major companion and third caliph", description: "Known for modesty, generosity, and his role in preserving the Qur'an." },
  { name: "Ali ibn Abi Talib", category: "Ten Promised Paradise", role: "Cousin, son-in-law, and fourth caliph", description: "Raised in the Prophet's ﷺ household and known for courage, knowledge, and sacrifice." },
  { name: "Talhah ibn Ubaydillah", category: "Ten Promised Paradise", role: "Early companion", description: "A noble companion known for bravery and sacrifice." },
  { name: "Al-Zubayr ibn al-Awwam", category: "Ten Promised Paradise", role: "Early companion", description: "A courageous companion and close relative of the Prophet ﷺ." },
  { name: "Abd al-Rahman ibn Awf", category: "Ten Promised Paradise", role: "Early companion and merchant", description: "Known for his generosity, business skill, and sacrifice for Islam." },
  { name: "Sa'd ibn Abi Waqqas", category: "Ten Promised Paradise", role: "Early companion and military leader", description: "One of the earliest Muslims and a major figure in later Islamic leadership." },
  { name: "Sa'id ibn Zayd", category: "Ten Promised Paradise", role: "Early companion", description: "One of the ten promised Paradise and among the early believers." },
  { name: "Abu Ubaydah ibn al-Jarrah", category: "Ten Promised Paradise", role: "Trustworthy leader", description: "Known as the trustworthy one of this Ummah." },
  { name: "Bilal ibn Rabah", category: "Early Muslims", role: "First major mu'adhdhin", description: "A formerly enslaved companion known for patience under torture and his powerful call to prayer." },
  { name: "Ammar ibn Yasir", category: "Early Muslims", role: "Persecuted early companion", description: "One of the early Muslims who endured severe persecution in Makkah." },
  { name: "Yasir ibn Amir", category: "Early Muslims", role: "Father of Ammar", description: "Among the early persecuted Muslims of Makkah." },
  { name: "Sumayyah bint Khayyat", category: "Women of the Seerah", role: "Early martyr", description: "Remembered as one of the first martyrs in Islam." },
  { name: "Khabbab ibn al-Aratt", category: "Early Muslims", role: "Persecuted early companion", description: "An early Muslim who suffered greatly under Quraysh persecution." },
  { name: "Mus'ab ibn Umayr", category: "Muhajirun", role: "First ambassador to Madinah", description: "Sent to teach Islam in Madinah before the Hijrah." },
  { name: "Al-Arqam ibn Abi al-Arqam", category: "Early Muslims", role: "Host of Dar al-Arqam", description: "His house became a secret meeting place for the early Muslims." },
  { name: "Ja'far ibn Abi Talib", category: "Muhajirun", role: "Leader among the migrants to Abyssinia", description: "Defended Islam before the Negus with wisdom and courage." },
  { name: "Zayd ibn Harithah", category: "Family of the Prophet ﷺ", role: "Beloved companion of the Prophet ﷺ", description: "Very close to the Prophet ﷺ and father of Usamah ibn Zayd." },
  { name: "Usamah ibn Zayd", category: "Young Companions", role: "Young leader", description: "Son of Zayd ibn Harithah and entrusted with leadership at a young age." },
  { name: "Abdullah ibn Mas'ud", category: "Scholars & Narrators", role: "Qur'an reciter and scholar", description: "Known for his knowledge of the Qur'an and closeness to the Prophet ﷺ." },
  { name: "Abu Dharr al-Ghifari", category: "Early Muslims", role: "Early companion", description: "Known for honesty, simplicity, and bold commitment to truth." },
  { name: "Salman al-Farsi", category: "Scholars & Narrators", role: "Persian companion", description: "His journey to Islam and advice during the Battle of the Trench made him a major figure." },
  { name: "Suhayb al-Rumi", category: "Muhajirun", role: "Early companion", description: "Sacrificed his wealth for the sake of migrating for Islam." },
  { name: "Al-Miqdad ibn Amr", category: "Military Figures", role: "Early Muslim fighter", description: "Known for bravery and firm support at Badr." },
  { name: "Uthman ibn Maz'un", category: "Early Muslims", role: "Early companion", description: "Among the early Muslims known for worship and restraint." },
  { name: "Abu Salamah ibn Abd al-Asad", category: "Muhajirun", role: "Early migrant", description: "One of the early Muslims who migrated and endured hardship." },
  { name: "Asma bint Abi Bakr", category: "Women of the Seerah", role: "Daughter of Abu Bakr", description: "Helped during the Hijrah and became known for courage and resolve." },
  { name: "Abdullah ibn Abi Bakr", category: "Muhajirun", role: "Helper during the Hijrah", description: "Assisted the Prophet ﷺ and Abu Bakr during their migration." },
  { name: "Amir ibn Fuhayrah", category: "Muhajirun", role: "Helper during the Hijrah", description: "Helped conceal the Hijrah route by tending sheep near the cave." },
  { name: "Fatimah bint al-Khattab", category: "Women of the Seerah", role: "Sister of Umar", description: "Her firmness helped lead to Umar's acceptance of Islam." },
  { name: "Sa'd ibn Mu'adh", category: "Ansar", role: "Leader of Aws", description: "A powerful leader of the Ansar whose support was central in Madinah." },
  { name: "Sa'd ibn Ubadah", category: "Ansar", role: "Leader of Khazraj", description: "A major Ansari leader known for generosity and influence." },
  { name: "As'ad ibn Zurarah", category: "Ansar", role: "Early Madinan Muslim", description: "Helped prepare Madinah for the arrival of the Prophet ﷺ." },
  { name: "Usaid ibn Hudayr", category: "Ansar", role: "Leader from Aws", description: "A respected Ansari leader who accepted Islam before the Hijrah." },
  { name: "Al-Bara' ibn Ma'rur", category: "Ansar", role: "Early supporter from Madinah", description: "One of the important figures connected to the pledges before Hijrah." },
  { name: "Abu Ayyub al-Ansari", category: "Ansar", role: "Host of the Prophet ﷺ", description: "Hosted the Prophet ﷺ when he first arrived in Madinah." },
  { name: "Anas ibn Malik", category: "Scholars & Narrators", role: "Servant of the Prophet ﷺ", description: "Served the Prophet ﷺ for years and narrated many hadith." },
  { name: "Umm Sulaym bint Milhan", category: "Women of the Seerah", role: "Mother of Anas", description: "A strong Ansari woman known for faith, patience, and courage." },
  { name: "Abu Talhah al-Ansari", category: "Ansar", role: "Companion from Madinah", description: "Known for bravery, generosity, and devotion to the Prophet ﷺ." },
  { name: "Umm Haram bint Milhan", category: "Women of the Seerah", role: "Female companion", description: "An honored woman from the Ansar connected to later Muslim expeditions." },
  { name: "Nusaybah bint Ka'b", category: "Women of the Seerah", role: "Defender at Uhud", description: "Known as Umm Amarah, she bravely defended the Prophet ﷺ at Uhud." },
  { name: "Abu Dujanah", category: "Military Figures", role: "Warrior companion", description: "Known for courage in battle, especially at Uhud." },
  { name: "Mu'adh ibn Jabal", category: "Scholars & Narrators", role: "Scholar among the companions", description: "Known for knowledge of halal and haram and sent to teach in Yemen." },
  { name: "Ubayy ibn Ka'b", category: "Scholars & Narrators", role: "Qur'an reciter", description: "One of the leading reciters and scribes of revelation." },
  { name: "Zayd ibn Thabit", category: "Scholars & Narrators", role: "Scribe of revelation", description: "A major scribe and later central figure in Qur'an compilation." },
  { name: "Abu Sa'id al-Khudri", category: "Scholars & Narrators", role: "Hadith narrator", description: "A young Ansari companion who narrated many hadith." },
  { name: "Jabir ibn Abdullah", category: "Scholars & Narrators", role: "Companion and narrator", description: "An Ansari companion known for narrating many reports from the Prophet ﷺ." },
  { name: "Abdullah ibn Rawahah", category: "Ansar", role: "Poet and fighter", description: "A poet of the Prophet ﷺ and one of the commanders at Mu'tah." },
  { name: "Hassan ibn Thabit", category: "Ansar", role: "Poet of the Prophet ﷺ", description: "Defended Islam with poetry against Quraysh attacks." },
  { name: "Ka'b ibn Malik", category: "Ansar", role: "Companion and poet", description: "Known for his honesty in the story of Tabuk." },
  { name: "Al-Bara' ibn Azib", category: "Young Companions", role: "Young companion", description: "Narrated important events and participated in later battles." },
  { name: "Sahl ibn Sa'd", category: "Young Companions", role: "Young companion and narrator", description: "A young Ansari who preserved many reports from the Prophet's ﷺ life." },
  { name: "Hudhayfah ibn al-Yaman", category: "Scholars & Narrators", role: "Keeper of secrets", description: "Known for being entrusted with sensitive knowledge about hypocrites." },
  { name: "Abu Qatadah al-Ansari", category: "Military Figures", role: "Companion and fighter", description: "Known for bravery and service in the Prophet's ﷺ expeditions." },
  { name: "Muhammad ibn Maslamah", category: "Ansar", role: "Trusted companion", description: "A strong Ansari companion involved in important Madinan events." },
  { name: "Thabit ibn Qays", category: "Ansar", role: "Speaker of the Ansar", description: "Known as a powerful speaker who defended Islam verbally." },
  { name: "Abu Hurairah", category: "Scholars & Narrators", role: "Major hadith narrator", description: "One of the most famous narrators of hadith from the Prophet ﷺ." },
  { name: "Abdullah ibn Umar", category: "Scholars & Narrators", role: "Son of Umar and narrator", description: "Known for careful adherence to the Sunnah." },
  { name: "Abdullah ibn Abbas", category: "Scholars & Narrators", role: "Scholar of Qur'an", description: "Cousin of the Prophet ﷺ and one of the great scholars among the companions." },
  { name: "Abdullah ibn Amr ibn al-As", category: "Scholars & Narrators", role: "Hadith narrator", description: "Known for writing and preserving hadith." },
  { name: "Amr ibn al-As", category: "Quraysh Leaders", role: "Late convert and commander", description: "A skilled leader who accepted Islam and later served the Muslim state." },
  { name: "Khalid ibn al-Walid", category: "Military Figures", role: "Commander", description: "A former opponent who became one of the greatest Muslim military commanders." },
  { name: "Ikrimah ibn Abi Jahl", category: "Quraysh Leaders", role: "Late convert", description: "Son of Abu Jahl who later accepted Islam and served the Muslim cause." },
  { name: "Abu Sufyan ibn Harb", category: "Quraysh Leaders", role: "Quraysh leader", description: "A major leader of Quraysh who later accepted Islam." },
  { name: "Hind bint Utbah", category: "Quraysh Leaders", role: "Influential Qurayshi woman", description: "Initially opposed Islam but later accepted it after the conquest of Makkah." },
  { name: "Mu'awiyah ibn Abi Sufyan", category: "Scribes & Administrators", role: "Companion and scribe", description: "Son of Abu Sufyan who became a scribe and later a major political figure." },
  { name: "Wahshi ibn Harb", category: "Late Converts", role: "Former opponent", description: "Killed Hamzah at Uhud, later accepted Islam, and fought against false prophecy." },
  { name: "Safwan ibn Umayyah", category: "Quraysh Leaders", role: "Late convert", description: "A noble Qurayshi leader who eventually accepted Islam." },
  { name: "Suhayl ibn Amr", category: "Quraysh Leaders", role: "Quraysh negotiator", description: "Represented Quraysh at Hudaybiyyah and later accepted Islam." },
  { name: "Hakim ibn Hizam", category: "Quraysh Leaders", role: "Nobleman of Makkah", description: "A respected Qurayshi figure who later accepted Islam." },
  { name: "Al-Tufayl ibn Amr al-Dawsi", category: "Tribal Leaders", role: "Leader from Daws", description: "Accepted Islam and called his people to the message." },
  { name: "Abu Musa al-Ash'ari", category: "Scholars & Narrators", role: "Companion and reciter", description: "Known for his beautiful recitation and leadership." },
  { name: "Jarir ibn Abdullah al-Bajali", category: "Tribal Leaders", role: "Late companion", description: "A respected tribal leader who accepted Islam and served the Muslim community." },
  { name: "Adi ibn Hatim", category: "Tribal Leaders", role: "Former Christian Arab leader", description: "Accepted Islam after meeting the Prophet ﷺ and became an important companion." },
  { name: "Dihyah al-Kalbi", category: "Rulers & Envoys", role: "Envoy of the Prophet ﷺ", description: "Sent as an envoy to the Byzantine ruler." },
  { name: "Al-Ala al-Hadrami", category: "Rulers & Envoys", role: "Envoy and governor", description: "Served the Prophet ﷺ in administrative and diplomatic roles." },
  { name: "Hatib ibn Abi Balta'ah", category: "Muhajirun", role: "Companion of Badr", description: "A companion involved in a major incident before the conquest of Makkah." },
  { name: "Abu Lubabah ibn Abd al-Mundhir", category: "Ansar", role: "Ansari companion", description: "Known for his repentance after a serious mistake during the Madinan period." },
  { name: "Abu Bakrah Nufay' ibn al-Harith", category: "Companions", role: "Companion from Ta'if", description: "Connected to the events around Ta'if and later known as a narrator." },
  { name: "Al-Mughira ibn Shu'bah", category: "Companions", role: "Late companion and leader", description: "Accepted Islam and later became known for political and administrative skill." },
  { name: "Hamzah ibn Abd al-Muttalib", category: "Family of the Prophet ﷺ", role: "Uncle of the Prophet ﷺ", description: "A brave defender of Islam and martyr of Uhud." },
  { name: "Al-Abbas ibn Abd al-Muttalib", category: "Family of the Prophet ﷺ", role: "Uncle of the Prophet ﷺ", description: "A respected elder of Banu Hashim who later accepted Islam." },
  { name: "Safiyyah bint Abd al-Muttalib", category: "Family of the Prophet ﷺ", role: "Aunt of the Prophet ﷺ", description: "Mother of al-Zubayr and a strong woman from Banu Hashim." },
  { name: "Abu Talib ibn Abd al-Muttalib", category: "Family of the Prophet ﷺ", role: "Uncle and protector", description: "Protected the Prophet ﷺ in Makkah despite not accepting Islam." },
  { name: "Abd al-Muttalib", category: "Family of the Prophet ﷺ", role: "Grandfather of the Prophet ﷺ", description: "A respected leader of Quraysh and guardian of the Prophet ﷺ in childhood." },
  { name: "Abdullah ibn Abd al-Muttalib", category: "Family of the Prophet ﷺ", role: "Father of the Prophet ﷺ", description: "Passed away before the birth of the Prophet ﷺ." },
  { name: "Aminah bint Wahb", category: "Family of the Prophet ﷺ", role: "Mother of the Prophet ﷺ", description: "Mother of the Prophet ﷺ who passed away when he was young." },
  { name: "Halimah al-Sa'diyyah", category: "Family of the Prophet ﷺ", role: "Foster mother", description: "Nursed and cared for the Prophet ﷺ during his early childhood." },
  { name: "Barakah Umm Ayman", category: "Family of the Prophet ﷺ", role: "Caregiver of the Prophet ﷺ", description: "A beloved woman who cared for the Prophet ﷺ from childhood." },
  { name: "Abu Jahl Amr ibn Hisham", category: "Opponents", role: "Major opponent in Makkah", description: "One of the fiercest enemies of the Prophet ﷺ and leader against Islam." },
  { name: "Abu Lahab", category: "Opponents", role: "Uncle and enemy of Islam", description: "Opposed the Prophet ﷺ harshly despite being from his own family." },
  { name: "Umm Jamil", category: "Opponents", role: "Wife of Abu Lahab", description: "Opposed the Prophet ﷺ and supported her husband's hostility." },
  { name: "Utbah ibn Rabi'ah", category: "Opponents", role: "Quraysh elder", description: "A leading opponent from Quraysh involved in early confrontations." },
  { name: "Shaybah ibn Rabi'ah", category: "Opponents", role: "Quraysh leader", description: "A Qurayshi opponent involved in conflict with the Muslims." },
  { name: "Al-Walid ibn Utbah", category: "Opponents", role: "Quraysh fighter", description: "One of the Qurayshi figures connected to the Battle of Badr." },
  { name: "Umayyah ibn Khalaf", category: "Opponents", role: "Persecutor of Bilal", description: "A Makkan opponent known for torturing Bilal ibn Rabah." },
  { name: "Ubayy ibn Khalaf", category: "Opponents", role: "Makkan enemy", description: "A hostile opponent of the Prophet ﷺ during the Makkan and Madinan period." },
  { name: "Al-Walid ibn al-Mughirah", category: "Opponents", role: "Quraysh elder", description: "A powerful Makkan leader who rejected the message." },
  { name: "Al-Nadr ibn al-Harith", category: "Opponents", role: "Makkan opponent", description: "Used stories and arguments to distract people from the Qur'an." },
  { name: "Uqbah ibn Abi Mu'ayt", category: "Opponents", role: "Makkan persecutor", description: "Known for his severe hostility toward the Prophet ﷺ." },
  { name: "Mut'im ibn Adi", category: "Quraysh Leaders", role: "Makkan nobleman", description: "Though not Muslim, he gave protection to the Prophet ﷺ after Ta'if." },
  { name: "Abdullah ibn Ubayy ibn Salul", category: "Opponents", role: "Leader of the hypocrites", description: "A major internal opponent in Madinah who caused harm to the Muslim community." },
  { name: "Ka'b ibn al-Ashraf", category: "Opponents", role: "Enemy in Madinah", description: "A hostile figure in Madinah who opposed the Prophet ﷺ." },
  { name: "Huyayy ibn Akhtab", category: "Opponents", role: "Tribal leader", description: "A major opponent involved in stirring hostility against the Muslims." },
  { name: "Salam ibn Abi al-Huqayq", category: "Opponents", role: "Opponent from Khaybar", description: "One of the hostile figures connected to plots against the Muslims." },
  { name: "Kinana ibn al-Rabi'", category: "Opponents", role: "Figure from Khaybar", description: "A leader connected to the events of Khaybar." },
  { name: "Al-Najashi", category: "Rulers & Envoys", role: "Ruler of Abyssinia", description: "Gave protection to the early Muslim migrants who fled persecution." },
  { name: "Heraclius", category: "Rulers & Envoys", role: "Byzantine emperor", description: "Received a letter from the Prophet ﷺ inviting him to Islam." },
  { name: "Kisra", category: "Rulers & Envoys", role: "Persian ruler", description: "Received a letter from the Prophet ﷺ and rejected it arrogantly." },
  { name: "Al-Muqawqis", category: "Rulers & Envoys", role: "Egyptian ruler", description: "Received the Prophet's ﷺ message and responded diplomatically." },
  { name: "Badhan", category: "Rulers & Envoys", role: "Persian governor in Yemen", description: "Later accepted Islam and became connected to the Prophet's ﷺ authority in Yemen." },
  { name: "Musaylimah al-Kadhdhab", category: "Opponents", role: "False prophet", description: "Claimed prophethood and became a major threat near the end of the Prophet's ﷺ life and after his passing." },
];

const CATEGORIES = [
  "All",
  "Family of the Prophet ﷺ",
  "Mothers of the Believers",
  "Early Muslims",
  "Ten Promised Paradise",
  "Muhajirun",
  "Ansar",
  "Women of the Seerah",
  "Quraysh Leaders",
  "Opponents",
  "Rulers & Envoys",
  "Scholars & Narrators",
  "Military Figures",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Mothers of the Believers": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Family of the Prophet ﷺ": "bg-gold/10 text-gold border-gold/20",
  "Early Muslims": "bg-green-500/10 text-green-400 border-green-500/20",
  "Ten Promised Paradise": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Muhajirun": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Ansar": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Women of the Seerah": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Quraysh Leaders": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Opponents": "bg-red-500/10 text-red-400 border-red-500/20",
  "Rulers & Envoys": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Scholars & Narrators": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Military Figures": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Young Companions": "bg-lime-500/10 text-lime-400 border-lime-500/20",
  "Tribal Leaders": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Late Converts": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Scribes & Administrators": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Companions": "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const INITIAL_DISPLAY_COUNT = 24;

export function KeyPeopleContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const filteredPeople = useMemo(() => {
    let results = PEOPLE_DATA;

    // Filter by category
    if (selectedCategory !== "All") {
      results = results.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.role.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    return results;
  }, [searchQuery, selectedCategory]);

  const displayedPeople = showAll ? filteredPeople : filteredPeople.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = filteredPeople.length > INITIAL_DISPLAY_COUNT;

  return (
    <main className="min-h-screen bg-ink py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Back link */}
        <Link
          href="/reference"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Reference Library
        </Link>

        {/* Page header */}
        <div className="mb-12">
          <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
            Reference Library
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Key People in the Seerah
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            Companions, leaders, and figures whose roles shaped the early Muslim community.
          </p>

          {/* Important note */}
          <div className="flex gap-3 p-4 rounded-xl border border-gold/20 bg-gold-bg/30 text-sm">
            <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
            <p className="text-text-secondary leading-relaxed">
              Some figures listed were believers, some were opponents, and some were outside
              rulers. They are included because their roles affected the Seerah.
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-surface text-text placeholder-text-muted focus:outline-none focus:border-gold/40 transition-colors"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    isActive
                      ? "bg-gold/10 text-gold border-gold/30"
                      : "bg-surface text-text-secondary hover:text-text border-border hover:border-gold/20"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 flex items-center gap-2 text-sm text-text-muted">
          <Users className="w-4 h-4" />
          <span>
            Showing {displayedPeople.length} of {filteredPeople.length} key figures
            {selectedCategory !== "All" || searchQuery ? (
              <> (filtered)</>
            ) : (
              <> included</>
            )}
          </span>
        </div>

        {/* People grid */}
        {filteredPeople.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-secondary">No people found matching your search.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedPeople.map((person, index) => {
                const initial = person.name.charAt(0).toUpperCase();
                const badgeColor = CATEGORY_COLORS[person.category] || "bg-surface-raised text-text-muted border-border";
                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors flex flex-col gap-3"
                  >
                    {/* Initial circle */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold font-bold text-sm">{initial}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-text leading-tight mb-1">
                          {person.name}
                        </h3>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}
                        >
                          {person.category}
                        </span>
                      </div>
                    </div>

                    {/* Role */}
                    <p className="text-xs font-medium text-gold">{person.role}</p>

                    {/* Description */}
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {person.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Show more/less */}
            {hasMore && !searchQuery && selectedCategory === "All" && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface border border-border hover:border-gold/40 text-text-secondary hover:text-text font-medium text-sm transition-colors"
                >
                  {showAll ? "Show Less" : `Show All ${filteredPeople.length} People`}
                </button>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <section className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="text-sm text-text-muted mb-1">Ready to go deeper?</p>
              <p className="text-base font-semibold text-text">
                Learn how these figures connect in the full 100-part Seerah course.
              </p>
            </div>
            <Link
              href="/seerah"
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-ink font-semibold text-sm hover:bg-gold-light transition-colors"
            >
              Continue Learning the Seerah
            </Link>
          </div>
        </section>

        {/* Back link */}
        <div className="mt-12 pb-4">
          <Link
            href="/reference"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Reference Library
          </Link>
        </div>

      </div>
    </main>
  );
}
