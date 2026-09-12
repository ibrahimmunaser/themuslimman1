"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Users, Info } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";

interface Person {
  name: string;
  category: string;
  role: string;
  description: string;
  nameAr?: string;
  roleAr?: string;
  descriptionAr?: string;
  nameFr?: string;
  roleFr?: string;
  descriptionFr?: string;
}

const PEOPLE_DATA: Person[] = [
  { name: "Khadijah bint Khuwaylid", category: "Mothers of the Believers", role: "First wife of the Prophet ﷺ", description: "The first person to believe in the Prophet ﷺ and one of his greatest supporters.", nameAr: "خديجة بنت خويلد", roleAr: "أول زوجات النبي ﷺ", descriptionAr: "أول من آمن بالنبي ﷺ وكانت من أعظم أنصاره رضي الله عنها.", nameFr: "Khadija bint Khuwaylid", roleFr: "Première épouse du Prophète ﷺ", descriptionFr: "La première personne à croire au Prophète ﷺ et l'un de ses plus grands soutiens." },
  { name: "Aisha bint Abi Bakr", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ and scholar", description: "A major narrator of hadith and one of the most knowledgeable women of the Ummah.", nameAr: "عائشة بنت أبي بكر", roleAr: "زوجة النبي ﷺ وعالمة", descriptionAr: "من أكثر الرواة للحديث النبوي وكانت من أعلم نساء الأمة رضي الله عنها.", nameFr: "Aïcha bint Abi Bakr", roleFr: "Épouse du Prophète ﷺ et savante", descriptionFr: "Grande rapporteuse de hadiths et l'une des femmes les plus savantes de la Oumma." },
  { name: "Sawdah bint Zam'ah", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "One of the early Muslim women who showed loyalty and patience during hardship.", nameAr: "سودة بنت زمعة", roleAr: "زوجة النبي ﷺ", descriptionAr: "من أوائل المسلمات اللاتي أظهرن الوفاء والصبر في زمن الشدة رضي الله عنها.", nameFr: "Sawda bint Zam'a", roleFr: "Épouse du Prophète ﷺ", descriptionFr: "L'une des premières musulmanes, connue pour sa loyauté et sa patience dans l'épreuve." },
  { name: "Hafsah bint Umar", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "Daughter of Umar ibn al-Khattab and a guardian of an early written copy of the Qur'an.", nameAr: "حفصة بنت عمر", roleAr: "زوجة النبي ﷺ", descriptionAr: "ابنة عمر بن الخطاب، وكانت أمينة على أحد أوائل النسخ المكتوبة للقرآن الكريم رضي الله عنها.", nameFr: "Hafsa bint Umar", roleFr: "Épouse du Prophète ﷺ", descriptionFr: "Fille de Umar ibn al-Khattab et gardienne d'une des premières copies écrites du Coran." },
  { name: "Umm Salamah Hind bint Abi Umayyah", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "Known for wisdom, patience, and strong judgment during difficult moments.", nameAr: "أم سلمة هند بنت أبي أمية", roleAr: "زوجة النبي ﷺ", descriptionAr: "عُرفت بالحكمة والصبر وحسن الرأي في المواقف الصعبة رضي الله عنها.", nameFr: "Oumm Salama Hind bint Abi Umayya", roleFr: "Épouse du Prophète ﷺ", descriptionFr: "Connue pour sa sagesse, sa patience et son bon jugement dans les moments difficiles." },
  { name: "Zaynab bint Jahsh", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "Known for generosity and her important role in the Madinan period.", nameAr: "زينب بنت جحش", roleAr: "زوجة النبي ﷺ", descriptionAr: "عُرفت بالكرم ولها دور مهم في العهد المدني رضي الله عنها.", nameFr: "Zaynab bint Jahsh", roleFr: "Épouse du Prophète ﷺ", descriptionFr: "Connue pour sa générosité et son rôle important à la période médinoise." },
  { name: "Juwayriyah bint al-Harith", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "Her marriage to the Prophet ﷺ brought blessing and freedom to many from her tribe.", nameAr: "جويرية بنت الحارث", roleAr: "زوجة النبي ﷺ", descriptionAr: "كان زواجها من النبي ﷺ سببًا في البركة وعتق كثير من قومها رضي الله عنها.", nameFr: "Juwayriya bint al-Harith", roleFr: "Épouse du Prophète ﷺ", descriptionFr: "Son mariage avec le Prophète ﷺ apporta bénédiction et liberté à beaucoup de sa tribu." },
  { name: "Umm Habibah Ramlah bint Abi Sufyan", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "A believing woman who remained firm despite her father initially opposing Islam.", nameAr: "أم حبيبة رملة بنت أبي سفيان", roleAr: "زوجة النبي ﷺ", descriptionAr: "امرأة مؤمنة ثبتت على إيمانها مع أن أباها كان معارضًا للإسلام في البداية رضي الله عنها.", nameFr: "Oumm Habiba Ramla bint Abi Sufyan", roleFr: "Épouse du Prophète ﷺ", descriptionFr: "Femme croyante restée ferme alors que son père s'opposait d'abord à l'islam." },
  { name: "Safiyyah bint Huyayy", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "From a noble Jewish family of Madinah and later honored as a Mother of the Believers.", nameAr: "صفية بنت حيي", roleAr: "زوجة النبي ﷺ", descriptionAr: "من أسرة يهودية شريفة في المدينة، وتشرفت بعد ذلك بلقب أم من أمهات المؤمنين رضي الله عنها.", nameFr: "Safiya bint Huyayy", roleFr: "Épouse du Prophète ﷺ", descriptionFr: "Issue d'une noble famille juive de Médine, honorée ensuite comme Mère des croyants." },
  { name: "Maymunah bint al-Harith", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "One of the final women the Prophet ﷺ married.", nameAr: "ميمونة بنت الحارث", roleAr: "زوجة النبي ﷺ", descriptionAr: "كانت آخر من تزوجهن النبي ﷺ رضي الله عنها.", nameFr: "Maymuna bint al-Harith", roleFr: "Épouse du Prophète ﷺ", descriptionFr: "L'une des dernières femmes que le Prophète ﷺ épousa." },
  { name: "Zaynab bint Khuzaymah", category: "Mothers of the Believers", role: "Wife of the Prophet ﷺ", description: "Known as the \"Mother of the Poor\" because of her care for the needy.", nameAr: "زينب بنت خزيمة", roleAr: "زوجة النبي ﷺ", descriptionAr: "لُقبت بـ\"أم المساكين\" لعنايتها بالفقراء والمحتاجين رضي الله عنها.", nameFr: "Zaynab bint Khuzayma", roleFr: "Épouse du Prophète ﷺ", descriptionFr: "Surnommée la « Mère des pauvres » pour son souci des nécessiteux." },
  { name: "Maria al-Qibtiyyah", category: "Family of the Prophet ﷺ", role: "Mother of Ibrahim", description: "She was gifted to the Prophet ﷺ and bore his son Ibrahim.", nameAr: "مارية القبطية", roleAr: "أم إبراهيم", descriptionAr: "أُهديت إلى النبي ﷺ فولدت له ابنه إبراهيم.", nameFr: "Maria la Copte", roleFr: "Mère d'Ibrahim", descriptionFr: "Offerte au Prophète ﷺ, elle lui donna son fils Ibrahim." },
  { name: "Fatimah bint Muhammad", category: "Family of the Prophet ﷺ", role: "Daughter of the Prophet ﷺ", description: "Beloved daughter of the Prophet ﷺ and wife of Ali ibn Abi Talib.", nameAr: "فاطمة بنت محمد", roleAr: "ابنة النبي ﷺ", descriptionAr: "الابنة الحبيبة للنبي ﷺ وزوجة علي بن أبي طالب رضي الله عنها.", nameFr: "Fatima bint Muhammad", roleFr: "Fille du Prophète ﷺ", descriptionFr: "Fille bien-aimée du Prophète ﷺ et épouse de Ali ibn Abi Talib." },
  { name: "Zaynab bint Muhammad", category: "Family of the Prophet ﷺ", role: "Daughter of the Prophet ﷺ", description: "One of the daughters of the Prophet ﷺ who endured hardship for her faith.", nameAr: "زينب بنت محمد", roleAr: "ابنة النبي ﷺ", descriptionAr: "إحدى بنات النبي ﷺ، تحملت المشقة في سبيل إيمانها رضي الله عنها.", nameFr: "Zaynab bint Muhammad", roleFr: "Fille du Prophète ﷺ", descriptionFr: "L'une des filles du Prophète ﷺ qui endura l'épreuve pour sa foi." },
  { name: "Ruqayyah bint Muhammad", category: "Family of the Prophet ﷺ", role: "Daughter of the Prophet ﷺ", description: "Wife of Uthman ibn Affan and among those connected to the early migrations.", nameAr: "رقية بنت محمد", roleAr: "ابنة النبي ﷺ", descriptionAr: "زوجة عثمان بن عفان، وممن هاجرن في الهجرات الأولى رضي الله عنها.", nameFr: "Ruqayya bint Muhammad", roleFr: "Fille du Prophète ﷺ", descriptionFr: "Épouse de Uthman ibn Affan et parmi celles liées aux premières migrations." },
  { name: "Umm Kulthum bint Muhammad", category: "Family of the Prophet ﷺ", role: "Daughter of the Prophet ﷺ", description: "Later married Uthman ibn Affan after the passing of Ruqayyah.", nameAr: "أم كلثوم بنت محمد", roleAr: "ابنة النبي ﷺ", descriptionAr: "تزوجها عثمان بن عفان بعد وفاة أختها رقية رضي الله عنها.", nameFr: "Oumm Kulthum bint Muhammad", roleFr: "Fille du Prophète ﷺ", descriptionFr: "Épousa ensuite Uthman ibn Affan après le décès de Ruqayya." },
  { name: "Al-Qasim ibn Muhammad", category: "Family of the Prophet ﷺ", role: "Son of the Prophet ﷺ", description: "A son of the Prophet ﷺ who passed away in childhood.", nameAr: "القاسم بن محمد", roleAr: "ابن النبي ﷺ", descriptionAr: "ابن للنبي ﷺ توفي في طفولته.", nameFr: "Al-Qasim ibn Muhammad", roleFr: "Fils du Prophète ﷺ", descriptionFr: "Fils du Prophète ﷺ décédé dans l'enfance." },
  { name: "Abdullah ibn Muhammad", category: "Family of the Prophet ﷺ", role: "Son of the Prophet ﷺ", description: "A son of the Prophet ﷺ who passed away young.", nameAr: "عبد الله بن محمد", roleAr: "ابن النبي ﷺ", descriptionAr: "ابن للنبي ﷺ توفي صغيرًا.", nameFr: "Abdullah ibn Muhammad", roleFr: "Fils du Prophète ﷺ", descriptionFr: "Fils du Prophète ﷺ décédé jeune." },
  { name: "Ibrahim ibn Muhammad", category: "Family of the Prophet ﷺ", role: "Son of the Prophet ﷺ", description: "The young son of the Prophet ﷺ and Maria al-Qibtiyyah.", nameAr: "إبراهيم بن محمد", roleAr: "ابن النبي ﷺ", descriptionAr: "الابن الصغير للنبي ﷺ من مارية القبطية.", nameFr: "Ibrahim ibn Muhammad", roleFr: "Fils du Prophète ﷺ", descriptionFr: "Le jeune fils du Prophète ﷺ et de Maria la Copte." },
  { name: "Abu Bakr al-Siddiq", category: "Ten Promised Paradise", role: "Closest companion and first caliph", description: "The Prophet's ﷺ closest companion, supporter during the Hijrah, and first caliph.", nameAr: "أبو بكر الصديق", roleAr: "أقرب الصحابة وأول الخلفاء", descriptionAr: "أقرب أصحاب النبي ﷺ وصاحبه في الهجرة، وأول من تولى الخلافة من بعده رضي الله عنه.", nameFr: "Abou Bakr as-Siddiq", roleFr: "Compagnon le plus proche et premier calife", descriptionFr: "Le plus proche compagnon du Prophète ﷺ, soutien durant l'Hégire, et premier calife." },
  { name: "Umar ibn al-Khattab", category: "Ten Promised Paradise", role: "Major companion and second caliph", description: "His Islam strengthened the Muslims and his leadership shaped the early Ummah.", nameAr: "عمر بن الخطاب", roleAr: "صحابي عظيم وثاني الخلفاء", descriptionAr: "كان إسلامه عزًا للمسلمين، وشكّلت قيادته ملامح الأمة في عهدها الأول رضي الله عنه.", nameFr: "Umar ibn al-Khattab", roleFr: "Grand compagnon et deuxième calife", descriptionFr: "Son islam renforça les musulmans et son leadership façonna la première Oumma." },
  { name: "Uthman ibn Affan", category: "Ten Promised Paradise", role: "Major companion and third caliph", description: "Known for modesty, generosity, and his role in preserving the Qur'an.", nameAr: "عثمان بن عفان", roleAr: "صحابي عظيم وثالث الخلفاء", descriptionAr: "عُرف بالحياء والكرم وله دور عظيم في جمع القرآن الكريم رضي الله عنه.", nameFr: "Uthman ibn Affan", roleFr: "Grand compagnon et troisième calife", descriptionFr: "Connu pour sa pudeur, sa générosité et son rôle dans la préservation du Coran." },
  { name: "Ali ibn Abi Talib", category: "Ten Promised Paradise", role: "Cousin, son-in-law, and fourth caliph", description: "Raised in the Prophet's ﷺ household and known for courage, knowledge, and sacrifice.", nameAr: "علي بن أبي طالب", roleAr: "ابن عم النبي ﷺ وصهره ورابع الخلفاء", descriptionAr: "نشأ في بيت النبي ﷺ، وعُرف بالشجاعة والعلم والتضحية رضي الله عنه.", nameFr: "Ali ibn Abi Talib", roleFr: "Cousin, gendre et quatrième calife", descriptionFr: "Élevé dans la maison du Prophète ﷺ, connu pour son courage, son savoir et son sacrifice." },
  { name: "Talhah ibn Ubaydillah", category: "Ten Promised Paradise", role: "Early companion", description: "A noble companion known for bravery and sacrifice.", nameAr: "طلحة بن عبيد الله", roleAr: "من السابقين إلى الإسلام", descriptionAr: "صحابي كريم عُرف بالشجاعة والتضحية رضي الله عنه.", nameFr: "Talha ibn Ubaydillah", roleFr: "Compagnon parmi les premiers", descriptionFr: "Noble compagnon connu pour sa bravoure et son sacrifice." },
  { name: "Al-Zubayr ibn al-Awwam", category: "Ten Promised Paradise", role: "Early companion", description: "A courageous companion and close relative of the Prophet ﷺ.", nameAr: "الزبير بن العوام", roleAr: "من السابقين إلى الإسلام", descriptionAr: "صحابي شجاع وقريب للنبي ﷺ رضي الله عنه.", nameFr: "Az-Zubayr ibn al-Awwam", roleFr: "Compagnon parmi les premiers", descriptionFr: "Compagnon courageux et proche parent du Prophète ﷺ." },
  { name: "Abd al-Rahman ibn Awf", category: "Ten Promised Paradise", role: "Early companion and merchant", description: "Known for his generosity, business skill, and sacrifice for Islam.", nameAr: "عبد الرحمن بن عوف", roleAr: "من السابقين إلى الإسلام وتاجر", descriptionAr: "عُرف بالكرم وحسن التجارة والتضحية في سبيل الإسلام رضي الله عنه.", nameFr: "Abd ar-Rahman ibn Awf", roleFr: "Compagnon parmi les premiers et commerçant", descriptionFr: "Connu pour sa générosité, son talent commercial et son sacrifice pour l'islam." },
  { name: "Sa'd ibn Abi Waqqas", category: "Ten Promised Paradise", role: "Early companion and military leader", description: "One of the earliest Muslims and a major figure in later Islamic leadership.", nameAr: "سعد بن أبي وقاص", roleAr: "من السابقين إلى الإسلام وقائد عسكري", descriptionAr: "من أوائل من أسلم، وكان من كبار القادة في العهود الإسلامية اللاحقة رضي الله عنه.", nameFr: "Sa'd ibn Abi Waqqas", roleFr: "Compagnon parmi les premiers et chef militaire", descriptionFr: "L'un des tout premiers musulmans et figure majeure du leadership islamique ultérieur." },
  { name: "Sa'id ibn Zayd", category: "Ten Promised Paradise", role: "Early companion", description: "One of the ten promised Paradise and among the early believers.", nameAr: "سعيد بن زيد", roleAr: "من السابقين إلى الإسلام", descriptionAr: "من العشرة المبشرين بالجنة ومن أوائل المؤمنين رضي الله عنه.", nameFr: "Sa'id ibn Zayd", roleFr: "Compagnon parmi les premiers", descriptionFr: "L'un des dix promis au Paradis et parmi les premiers croyants." },
  { name: "Abu Ubaydah ibn al-Jarrah", category: "Ten Promised Paradise", role: "Trustworthy leader", description: "Known as the trustworthy one of this Ummah.", nameAr: "أبو عبيدة بن الجراح", roleAr: "أمين هذه الأمة", descriptionAr: "لُقب بأمين هذه الأمة رضي الله عنه.", nameFr: "Abou Ubayda ibn al-Jarrah", roleFr: "Leader digne de confiance", descriptionFr: "Connu comme le digne de confiance de cette Oumma." },
  { name: "Bilal ibn Rabah", category: "Early Muslims", role: "First major mu'adhdhin", description: "A formerly enslaved companion known for patience under torture and his powerful call to prayer.", nameAr: "بلال بن رباح", roleAr: "أول المؤذنين", descriptionAr: "صحابي كان رقيقًا فأعتق، عُرف بصبره على العذاب وجمال صوته في الأذان رضي الله عنه.", nameFr: "Bilal ibn Rabah", roleFr: "Premier grand muezzin", descriptionFr: "Ancien esclave, compagnon connu pour sa patience sous la torture et son puissant appel à la prière." },
  { name: "Ammar ibn Yasir", category: "Early Muslims", role: "Persecuted early companion", description: "One of the early Muslims who endured severe persecution in Makkah.", nameAr: "عمار بن ياسر", roleAr: "من الصحابة الذين عُذبوا في مكة", descriptionAr: "من أوائل المسلمين الذين تحملوا أشد أنواع التعذيب في مكة رضي الله عنه.", nameFr: "Ammar ibn Yasir", roleFr: "Compagnon persécuté parmi les premiers", descriptionFr: "L'un des premiers musulmans qui endura une sévère persécution à La Mecque." },
  { name: "Yasir ibn Amir", category: "Early Muslims", role: "Father of Ammar", description: "Among the early persecuted Muslims of Makkah.", nameAr: "ياسر بن عامر", roleAr: "والد عمار", descriptionAr: "من أوائل المسلمين المعذبين في مكة.", nameFr: "Yasir ibn Amir", roleFr: "Père de Ammar", descriptionFr: "Parmi les premiers musulmans persécutés de La Mecque." },
  { name: "Sumayyah bint Khayyat", category: "Women of the Seerah", role: "Early martyr", description: "Remembered as one of the first martyrs in Islam.", nameAr: "سمية بنت خياط", roleAr: "أول شهيدة في الإسلام", descriptionAr: "تُذكر بأنها أول من نالت الشهادة في سبيل الإسلام رضي الله عنها.", nameFr: "Sumayya bint Khayyat", roleFr: "Martyre parmi les premières", descriptionFr: "Rappelons-nous d'elle comme l'une des premières martyres de l'islam." },
  { name: "Khabbab ibn al-Aratt", category: "Early Muslims", role: "Persecuted early companion", description: "An early Muslim who suffered greatly under Quraysh persecution.", nameAr: "خباب بن الأرت", roleAr: "من الصحابة الذين عُذبوا في مكة", descriptionAr: "من أوائل المسلمين الذين لاقوا عذابًا شديدًا من قريش رضي الله عنه.", nameFr: "Khabbab ibn al-Aratt", roleFr: "Compagnon persécuté parmi les premiers", descriptionFr: "Premier musulman qui souffrit beaucoup sous la persécution de Quraysh." },
  { name: "Mus'ab ibn Umayr", category: "Muhajirun", role: "First ambassador to Madinah", description: "Sent to teach Islam in Madinah before the Hijrah.", nameAr: "مصعب بن عمير", roleAr: "أول سفير للإسلام إلى المدينة", descriptionAr: "أرسله النبي ﷺ إلى المدينة ليعلّم أهلها الإسلام قبل الهجرة رضي الله عنه.", nameFr: "Mus'ab ibn Umayr", roleFr: "Premier ambassadeur à Médine", descriptionFr: "Envoyé enseigner l'islam à Médine avant l'Hégire." },
  { name: "Al-Arqam ibn Abi al-Arqam", category: "Early Muslims", role: "Host of Dar al-Arqam", description: "His house became a secret meeting place for the early Muslims.", nameAr: "الأرقم بن أبي الأرقم", roleAr: "صاحب دار الأرقم", descriptionAr: "أصبح بيته مكانًا سريًا يجتمع فيه المسلمون الأوائل رضي الله عنه.", nameFr: "Al-Arqam ibn Abi al-Arqam", roleFr: "Hôte de Dar al-Arqam", descriptionFr: "Sa maison devint un lieu de réunion secret pour les premiers musulmans." },
  { name: "Ja'far ibn Abi Talib", category: "Muhajirun", role: "Leader among the migrants to Abyssinia", description: "Defended Islam before the Negus with wisdom and courage.", nameAr: "جعفر بن أبي طالب", roleAr: "قائد المهاجرين إلى الحبشة", descriptionAr: "دافع عن الإسلام أمام النجاشي بحكمة وشجاعة رضي الله عنه.", nameFr: "Ja'far ibn Abi Talib", roleFr: "Chef parmi les migrants vers l'Abyssinie", descriptionFr: "Défendit l'islam devant le Négus avec sagesse et courage." },
  { name: "Zayd ibn Harithah", category: "Family of the Prophet ﷺ", role: "Beloved companion of the Prophet ﷺ", description: "Very close to the Prophet ﷺ and father of Usamah ibn Zayd.", nameAr: "زيد بن حارثة", roleAr: "الصحابي المحبوب عند النبي ﷺ", descriptionAr: "كان قريبًا جدًا من النبي ﷺ، وهو والد أسامة بن زيد رضي الله عنه.", nameFr: "Zayd ibn Haritha", roleFr: "Compagnon bien-aimé du Prophète ﷺ", descriptionFr: "Très proche du Prophète ﷺ et père de Usama ibn Zayd." },
  { name: "Usamah ibn Zayd", category: "Young Companions", role: "Young leader", description: "Son of Zayd ibn Harithah and entrusted with leadership at a young age.", nameAr: "أسامة بن زيد", roleAr: "قائد شاب", descriptionAr: "ابن زيد بن حارثة، وُلّي قيادة الجيش وهو في سن مبكرة رضي الله عنه.", nameFr: "Usama ibn Zayd", roleFr: "Jeune chef", descriptionFr: "Fils de Zayd ibn Haritha, confié un commandement dès son jeune âge." },
  { name: "Abdullah ibn Mas'ud", category: "Scholars & Narrators", role: "Qur'an reciter and scholar", description: "Known for his knowledge of the Qur'an and closeness to the Prophet ﷺ.", nameAr: "عبد الله بن مسعود", roleAr: "قارئ للقرآن وعالم", descriptionAr: "عُرف بعلمه بالقرآن الكريم وقربه من النبي ﷺ رضي الله عنه.", nameFr: "Abdullah ibn Mas'ud", roleFr: "Récitateur du Coran et savant", descriptionFr: "Connu pour sa science du Coran et sa proximité avec le Prophète ﷺ." },
  { name: "Abu Dharr al-Ghifari", category: "Early Muslims", role: "Early companion", description: "Known for honesty, simplicity, and bold commitment to truth.", nameAr: "أبو ذر الغفاري", roleAr: "من السابقين إلى الإسلام", descriptionAr: "عُرف بالصدق والبساطة والجرأة في قول الحق رضي الله عنه.", nameFr: "Abou Dharr al-Ghifari", roleFr: "Compagnon parmi les premiers", descriptionFr: "Connu pour son honnêteté, sa simplicité et son attachement audacieux à la vérité." },
  { name: "Salman al-Farsi", category: "Scholars & Narrators", role: "Persian companion", description: "His journey to Islam and advice during the Battle of the Trench made him a major figure.", nameAr: "سلمان الفارسي", roleAr: "الصحابي الفارسي", descriptionAr: "كانت رحلته إلى الإسلام ورأيه في غزوة الخندق سببًا في مكانته العظيمة رضي الله عنه.", nameFr: "Salman le Perse", roleFr: "Compagnon perse", descriptionFr: "Son chemin vers l'islam et son conseil lors de la bataille du Fossé firent de lui une figure majeure." },
  { name: "Suhayb al-Rumi", category: "Muhajirun", role: "Early companion", description: "Sacrificed his wealth for the sake of migrating for Islam.", nameAr: "صهيب الرومي", roleAr: "من السابقين إلى الإسلام", descriptionAr: "ضحى بماله في سبيل الهجرة من أجل الإسلام رضي الله عنه.", nameFr: "Suhayb ar-Rumi", roleFr: "Compagnon parmi les premiers", descriptionFr: "Sacrifia sa fortune pour migrer au nom de l'islam." },
  { name: "Al-Miqdad ibn Amr", category: "Military Figures", role: "Early Muslim fighter", description: "Known for bravery and firm support at Badr.", nameAr: "المقداد بن عمرو", roleAr: "مجاهد من أوائل المسلمين", descriptionAr: "عُرف بالشجاعة وثبات الموقف في غزوة بدر رضي الله عنه.", nameFr: "Al-Miqdad ibn Amr", roleFr: "Combattant musulman parmi les premiers", descriptionFr: "Connu pour sa bravoure et son ferme soutien à Badr." },
  { name: "Uthman ibn Maz'un", category: "Early Muslims", role: "Early companion", description: "Among the early Muslims known for worship and restraint.", nameAr: "عثمان بن مظعون", roleAr: "من أوائل الصحابة", descriptionAr: "كان رضي الله عنه من أوائل المسلمين، واشتهر بالعبادة والزهد.", nameFr: "Uthman ibn Maz'un", roleFr: "Compagnon parmi les premiers", descriptionFr: "Parmi les premiers musulmans, connu pour l'adoration et le détachement." },
  { name: "Abu Salamah ibn Abd al-Asad", category: "Muhajirun", role: "Early migrant", description: "One of the early Muslims who migrated and endured hardship.", nameAr: "أبو سلمة بن عبد الأسد", roleAr: "من أوائل المهاجرين", descriptionAr: "كان رضي الله عنه من أوائل من هاجر من المسلمين وصبر على المشقة.", nameFr: "Abou Salama ibn Abd al-Asad", roleFr: "Migrant parmi les premiers", descriptionFr: "L'un des premiers musulmans qui émigrèrent et endurèrent l'épreuve." },
  { name: "Asma bint Abi Bakr", category: "Women of the Seerah", role: "Daughter of Abu Bakr", description: "Helped during the Hijrah and became known for courage and resolve.", nameAr: "أسماء بنت أبي بكر", roleAr: "ابنة أبي بكر", descriptionAr: "ساعدت رضي الله عنها في الهجرة واشتهرت بالشجاعة والثبات.", nameFr: "Asma bint Abi Bakr", roleFr: "Fille de Abou Bakr", descriptionFr: "Aida durant l'Hégire et devint connue pour son courage et sa détermination." },
  { name: "Abdullah ibn Abi Bakr", category: "Muhajirun", role: "Helper during the Hijrah", description: "Assisted the Prophet ﷺ and Abu Bakr during their migration.", nameAr: "عبد الله بن أبي بكر", roleAr: "معين في الهجرة", descriptionAr: "أعان رضي الله عنه النبي ﷺ وأباه أبا بكر خلال هجرتهما.", nameFr: "Abdullah ibn Abi Bakr", roleFr: "Aide durant l'Hégire", descriptionFr: "Assista le Prophète ﷺ et Abou Bakr durant leur migration." },
  { name: "Amir ibn Fuhayrah", category: "Muhajirun", role: "Helper during the Hijrah", description: "Helped conceal the Hijrah route by tending sheep near the cave.", nameAr: "عامر بن فهيرة", roleAr: "معين في الهجرة", descriptionAr: "ساعد رضي الله عنه في إخفاء أثر طريق الهجرة برعي الغنم قرب الغار.", nameFr: "Amir ibn Fuhayra", roleFr: "Aide durant l'Hégire", descriptionFr: "Aida à dissimuler l'itinéraire de l'Hégire en faisant paître les moutons près de la grotte." },
  { name: "Fatimah bint al-Khattab", category: "Women of the Seerah", role: "Sister of Umar", description: "Her firmness helped lead to Umar's acceptance of Islam.", nameAr: "فاطمة بنت الخطاب", roleAr: "أخت عمر", descriptionAr: "كان ثباتها رضي الله عنها سبباً في إسلام أخيها عمر.", nameFr: "Fatima bint al-Khattab", roleFr: "Sœur de Umar", descriptionFr: "Sa fermeté contribua à l'acceptation de l'islam par Umar." },
  { name: "Sa'd ibn Mu'adh", category: "Ansar", role: "Leader of Aws", description: "A powerful leader of the Ansar whose support was central in Madinah.", nameAr: "سعد بن معاذ", roleAr: "زعيم الأوس", descriptionAr: "كان رضي الله عنه زعيماً قوياً من الأنصار، وكان دعمه أساسياً في المدينة.", nameFr: "Sa'd ibn Mu'adh", roleFr: "Chef des Aws", descriptionFr: "Puissant chef des Ansar dont le soutien fut central à Médine." },
  { name: "Sa'd ibn Ubadah", category: "Ansar", role: "Leader of Khazraj", description: "A major Ansari leader known for generosity and influence.", nameAr: "سعد بن عبادة", roleAr: "زعيم الخزرج", descriptionAr: "كان رضي الله عنه من كبار زعماء الأنصار، واشتهر بالكرم والنفوذ.", nameFr: "Sa'd ibn Ubada", roleFr: "Chef des Khazraj", descriptionFr: "Grand chef ansari connu pour sa générosité et son influence." },
  { name: "As'ad ibn Zurarah", category: "Ansar", role: "Early Madinan Muslim", description: "Helped prepare Madinah for the arrival of the Prophet ﷺ.", nameAr: "أسعد بن زرارة", roleAr: "من أوائل مسلمي المدينة", descriptionAr: "ساعد رضي الله عنه في تهيئة المدينة لاستقبال النبي ﷺ.", nameFr: "As'ad ibn Zurara", roleFr: "Musulman médinois parmi les premiers", descriptionFr: "Aida à préparer Médine à l'arrivée du Prophète ﷺ." },
  { name: "Usaid ibn Hudayr", category: "Ansar", role: "Leader from Aws", description: "A respected Ansari leader who accepted Islam before the Hijrah.", nameAr: "أسيد بن حضير", roleAr: "زعيم من الأوس", descriptionAr: "كان رضي الله عنه زعيماً محترماً من الأنصار أسلم قبل الهجرة.", nameFr: "Usayd ibn Hudayr", roleFr: "Chef des Aws", descriptionFr: "Chef ansari respecté qui accepta l'islam avant l'Hégire." },
  { name: "Al-Bara' ibn Ma'rur", category: "Ansar", role: "Early supporter from Madinah", description: "One of the important figures connected to the pledges before Hijrah.", nameAr: "البراء بن معرور", roleAr: "من أوائل أنصار النبي ﷺ من المدينة", descriptionAr: "كان رضي الله عنه من الشخصيات المهمة المرتبطة ببيعتي العقبة قبل الهجرة.", nameFr: "Al-Bara' ibn Ma'rur", roleFr: "Soutien médinois parmi les premiers", descriptionFr: "Figure importante liée aux serments avant l'Hégire." },
  { name: "Abu Ayyub al-Ansari", category: "Ansar", role: "Host of the Prophet ﷺ", description: "Hosted the Prophet ﷺ when he first arrived in Madinah.", nameAr: "أبو أيوب الأنصاري", roleAr: "مضيف النبي ﷺ", descriptionAr: "استضاف رضي الله عنه النبي ﷺ عند وصوله أول مرة إلى المدينة.", nameFr: "Abou Ayyub al-Ansari", roleFr: "Hôte du Prophète ﷺ", descriptionFr: "Hébergea le Prophète ﷺ à son arrivée à Médine." },
  { name: "Anas ibn Malik", category: "Scholars & Narrators", role: "Servant of the Prophet ﷺ", description: "Served the Prophet ﷺ for years and narrated many hadith.", nameAr: "أنس بن مالك", roleAr: "خادم النبي ﷺ", descriptionAr: "خدم رضي الله عنه النبي ﷺ سنين طويلة وروى عنه أحاديث كثيرة.", nameFr: "Anas ibn Malik", roleFr: "Serviteur du Prophète ﷺ", descriptionFr: "Servit le Prophète ﷺ pendant des années et rapporta de nombreux hadiths." },
  { name: "Umm Sulaym bint Milhan", category: "Women of the Seerah", role: "Mother of Anas", description: "A strong Ansari woman known for faith, patience, and courage.", nameAr: "أم سليم بنت ملحان", roleAr: "أم أنس", descriptionAr: "كانت رضي الله عنها امرأة قوية من الأنصار، اشتهرت بالإيمان والصبر والشجاعة.", nameFr: "Oumm Sulaym bint Milhan", roleFr: "Mère de Anas", descriptionFr: "Femme ansarie forte, connue pour sa foi, sa patience et son courage." },
  { name: "Abu Talhah al-Ansari", category: "Ansar", role: "Companion from Madinah", description: "Known for bravery, generosity, and devotion to the Prophet ﷺ.", nameAr: "أبو طلحة الأنصاري", roleAr: "صحابي من المدينة", descriptionAr: "اشتهر رضي الله عنه بالشجاعة والكرم والإخلاص للنبي ﷺ.", nameFr: "Abou Talha al-Ansari", roleFr: "Compagnon de Médine", descriptionFr: "Connu pour sa bravoure, sa générosité et son dévouement au Prophète ﷺ." },
  { name: "Umm Haram bint Milhan", category: "Women of the Seerah", role: "Female companion", description: "An honored woman from the Ansar connected to later Muslim expeditions.", nameAr: "أم حرام بنت ملحان", roleAr: "صحابية", descriptionAr: "كانت رضي الله عنها امرأة مكرّمة من الأنصار، ولها صلة بالغزوات البحرية اللاحقة.", nameFr: "Oumm Haram bint Milhan", roleFr: "Compagne", descriptionFr: "Femme honorée des Ansar, liée aux expéditions musulmanes ultérieures." },
  { name: "Nusaybah bint Ka'b", category: "Women of the Seerah", role: "Defender at Uhud", description: "Known as Umm Amarah, she bravely defended the Prophet ﷺ at Uhud.", nameAr: "نسيبة بنت كعب", roleAr: "مدافعة في أحد", descriptionAr: "عُرفت بأم عمارة، ودافعت رضي الله عنها بشجاعة عن النبي ﷺ يوم أحد.", nameFr: "Nusayba bint Ka'b", roleFr: "Défenseure à Uhud", descriptionFr: "Connue comme Oumm Amara, elle défendit bravement le Prophète ﷺ à Uhud." },
  { name: "Abu Dujanah", category: "Military Figures", role: "Warrior companion", description: "Known for courage in battle, especially at Uhud.", nameAr: "أبو دجانة", roleAr: "صحابي مقاتل", descriptionAr: "اشتهر رضي الله عنه بالشجاعة في القتال، لا سيما يوم أحد.", nameFr: "Abou Dujana", roleFr: "Compagnon guerrier", descriptionFr: "Connu pour son courage au combat, surtout à Uhud." },
  { name: "Mu'adh ibn Jabal", category: "Scholars & Narrators", role: "Scholar among the companions", description: "Known for knowledge of halal and haram and sent to teach in Yemen.", nameAr: "معاذ بن جبل", roleAr: "عالم من الصحابة", descriptionAr: "اشتهر رضي الله عنه بعلمه بالحلال والحرام، وأُرسل معلماً إلى اليمن.", nameFr: "Mu'adh ibn Jabal", roleFr: "Savant parmi les compagnons", descriptionFr: "Connu pour sa science du licite et de l'illicite, envoyé enseigner au Yémen." },
  { name: "Ubayy ibn Ka'b", category: "Scholars & Narrators", role: "Qur'an reciter", description: "One of the leading reciters and scribes of revelation.", nameAr: "أبي بن كعب", roleAr: "قارئ القرآن", descriptionAr: "كان رضي الله عنه من كبار قراء القرآن وكتّاب الوحي.", nameFr: "Ubayy ibn Ka'b", roleFr: "Récitateur du Coran", descriptionFr: "L'un des principaux récitateurs et scribes de la révélation." },
  { name: "Zayd ibn Thabit", category: "Scholars & Narrators", role: "Scribe of revelation", description: "A major scribe and later central figure in Qur'an compilation.", nameAr: "زيد بن ثابت", roleAr: "كاتب الوحي", descriptionAr: "كان رضي الله عنه من كبار كتّاب الوحي، ثم أصبح شخصية محورية في جمع القرآن.", nameFr: "Zayd ibn Thabit", roleFr: "Scribe de la révélation", descriptionFr: "Grand scribe, figure centrale plus tard dans la compilation du Coran." },
  { name: "Abu Sa'id al-Khudri", category: "Scholars & Narrators", role: "Hadith narrator", description: "A young Ansari companion who narrated many hadith.", nameAr: "أبو سعيد الخدري", roleAr: "راوي حديث", descriptionAr: "كان رضي الله عنه صحابياً شاباً من الأنصار روى أحاديث كثيرة.", nameFr: "Abou Sa'id al-Khudri", roleFr: "Rapporteur de hadiths", descriptionFr: "Jeune compagnon ansari qui rapporta de nombreux hadiths." },
  { name: "Jabir ibn Abdullah", category: "Scholars & Narrators", role: "Companion and narrator", description: "An Ansari companion known for narrating many reports from the Prophet ﷺ.", nameAr: "جابر بن عبد الله", roleAr: "صحابي وراوٍ", descriptionAr: "كان رضي الله عنه صحابياً من الأنصار اشتهر بروايته أحاديث كثيرة عن النبي ﷺ.", nameFr: "Jabir ibn Abdullah", roleFr: "Compagnon et rapporteur", descriptionFr: "Compagnon ansari connu pour avoir rapporté de nombreux récits du Prophète ﷺ." },
  { name: "Abdullah ibn Rawahah", category: "Ansar", role: "Poet and fighter", description: "A poet of the Prophet ﷺ and one of the commanders at Mu'tah.", nameAr: "عبد الله بن رواحة", roleAr: "شاعر ومقاتل", descriptionAr: "كان رضي الله عنه شاعر النبي ﷺ وأحد قادة معركة مؤتة.", nameFr: "Abdullah ibn Rawaha", roleFr: "Poète et combattant", descriptionFr: "Poète du Prophète ﷺ et l'un des commandants à Mu'ta." },
  { name: "Hassan ibn Thabit", category: "Ansar", role: "Poet of the Prophet ﷺ", description: "Defended Islam with poetry against Quraysh attacks.", nameAr: "حسان بن ثابت", roleAr: "شاعر النبي ﷺ", descriptionAr: "دافع رضي الله عنه عن الإسلام بشعره ضد هجمات قريش.", nameFr: "Hassan ibn Thabit", roleFr: "Poète du Prophète ﷺ", descriptionFr: "Défendit l'islam par la poésie contre les attaques de Quraysh." },
  { name: "Ka'b ibn Malik", category: "Ansar", role: "Companion and poet", description: "Known for his honesty in the story of Tabuk.", nameAr: "كعب بن مالك", roleAr: "صحابي وشاعر", descriptionAr: "اشتهر رضي الله عنه بصدقه في قصة تخلّفه عن غزوة تبوك.", nameFr: "Ka'b ibn Malik", roleFr: "Compagnon et poète", descriptionFr: "Connu pour son honnêteté dans l'histoire de Tabuk." },
  { name: "Al-Bara' ibn Azib", category: "Young Companions", role: "Young companion", description: "Narrated important events and participated in later battles.", nameAr: "البراء بن عازب", roleAr: "صحابي صغير السن", descriptionAr: "روى رضي الله عنه أحداثاً مهمة وشارك في الغزوات اللاحقة.", nameFr: "Al-Bara' ibn Azib", roleFr: "Jeune compagnon", descriptionFr: "Rapporta des événements importants et participa aux batailles ultérieures." },
  { name: "Sahl ibn Sa'd", category: "Young Companions", role: "Young companion and narrator", description: "A young Ansari who preserved many reports from the Prophet's ﷺ life.", nameAr: "سهل بن سعد", roleAr: "صحابي صغير السن وراوٍ", descriptionAr: "كان رضي الله عنه أنصارياً صغيراً حفظ كثيراً من أخبار حياة النبي ﷺ.", nameFr: "Sahl ibn Sa'd", roleFr: "Jeune compagnon et rapporteur", descriptionFr: "Jeune ansari qui préserva de nombreux récits de la vie du Prophète ﷺ." },
  { name: "Hudhayfah ibn al-Yaman", category: "Scholars & Narrators", role: "Keeper of secrets", description: "Known for being entrusted with sensitive knowledge about hypocrites.", nameAr: "حذيفة بن اليمان", roleAr: "صاحب سر النبي ﷺ", descriptionAr: "اشتهر رضي الله عنه بائتمان النبي ﷺ له على أسماء المنافقين.", nameFr: "Hudhayfa ibn al-Yaman", roleFr: "Gardien des secrets", descriptionFr: "Connu pour avoir été confié des connaissances sensibles sur les hypocrites." },
  { name: "Abu Qatadah al-Ansari", category: "Military Figures", role: "Companion and fighter", description: "Known for bravery and service in the Prophet's ﷺ expeditions.", nameAr: "أبو قتادة الأنصاري", roleAr: "صحابي ومقاتل", descriptionAr: "اشتهر رضي الله عنه بالشجاعة وخدمة النبي ﷺ في غزواته.", nameFr: "Abou Qatada al-Ansari", roleFr: "Compagnon et combattant", descriptionFr: "Connu pour sa bravoure et son service dans les expéditions du Prophète ﷺ." },
  { name: "Muhammad ibn Maslamah", category: "Ansar", role: "Trusted companion", description: "A strong Ansari companion involved in important Madinan events.", nameAr: "محمد بن مسلمة", roleAr: "صحابي موثوق", descriptionAr: "كان رضي الله عنه صحابياً قوياً من الأنصار شارك في أحداث مهمة بالمدينة.", nameFr: "Muhammad ibn Maslama", roleFr: "Compagnon de confiance", descriptionFr: "Solide compagnon ansari impliqué dans d'importants événements médinois." },
  { name: "Thabit ibn Qays", category: "Ansar", role: "Speaker of the Ansar", description: "Known as a powerful speaker who defended Islam verbally.", nameAr: "ثابت بن قيس", roleAr: "خطيب الأنصار", descriptionAr: "عُرف رضي الله عنه بخطيب فصيح دافع عن الإسلام بلسانه.", nameFr: "Thabit ibn Qays", roleFr: "Orateur des Ansar", descriptionFr: "Connu comme un orateur puissant qui défendit l'islam par la parole." },
  { name: "Abu Hurairah", category: "Scholars & Narrators", role: "Major hadith narrator", description: "One of the most famous narrators of hadith from the Prophet ﷺ.", nameAr: "أبو هريرة", roleAr: "أكثر الصحابة رواية للحديث", descriptionAr: "كان رضي الله عنه من أشهر رواة الحديث عن النبي ﷺ.", nameFr: "Abou Hurayra", roleFr: "Grand rapporteur de hadiths", descriptionFr: "L'un des plus célèbres rapporteurs de hadiths du Prophète ﷺ." },
  { name: "Abdullah ibn Umar", category: "Scholars & Narrators", role: "Son of Umar and narrator", description: "Known for careful adherence to the Sunnah.", nameAr: "عبد الله بن عمر", roleAr: "ابن عمر وراوٍ", descriptionAr: "اشتهر رضي الله عنه بتحرّيه الدقيق في اتباع السنة.", nameFr: "Abdullah ibn Umar", roleFr: "Fils de Umar et rapporteur", descriptionFr: "Connu pour son attachement scrupuleux à la Sunna." },
  { name: "Abdullah ibn Abbas", category: "Scholars & Narrators", role: "Scholar of Qur'an", description: "Cousin of the Prophet ﷺ and one of the great scholars among the companions.", nameAr: "عبد الله بن عباس", roleAr: "عالم القرآن", descriptionAr: "كان رضي الله عنه ابن عم النبي ﷺ وأحد كبار علماء الصحابة.", nameFr: "Abdullah ibn Abbas", roleFr: "Savant du Coran", descriptionFr: "Cousin du Prophète ﷺ et l'un des grands savants parmi les compagnons." },
  { name: "Abdullah ibn Amr ibn al-As", category: "Scholars & Narrators", role: "Hadith narrator", description: "Known for writing and preserving hadith.", nameAr: "عبد الله بن عمرو بن العاص", roleAr: "راوي حديث", descriptionAr: "اشتهر رضي الله عنه بكتابة الحديث وحفظه.", nameFr: "Abdullah ibn Amr ibn al-As", roleFr: "Rapporteur de hadiths", descriptionFr: "Connu pour avoir écrit et préservé des hadiths." },
  { name: "Amr ibn al-As", category: "Quraysh Leaders", role: "Late convert and commander", description: "A skilled leader who accepted Islam and later served the Muslim state.", nameAr: "عمرو بن العاص", roleAr: "قائد أسلم متأخراً", descriptionAr: "كان قائداً ماهراً أسلم رضي الله عنه ثم خدم الدولة الإسلامية.", nameFr: "Amr ibn al-As", roleFr: "Converti tardif et commandant", descriptionFr: "Leader habile qui accepta l'islam et servit ensuite l'État musulman." },
  { name: "Khalid ibn al-Walid", category: "Military Figures", role: "Commander", description: "A former opponent who became one of the greatest Muslim military commanders.", nameAr: "خالد بن الوليد", roleAr: "قائد", descriptionAr: "كان خصماً سابقاً ثم أصبح رضي الله عنه من أعظم القادة العسكريين المسلمين.", nameFr: "Khalid ibn al-Walid", roleFr: "Commandant", descriptionFr: "Ancien adversaire devenu l'un des plus grands commandants militaires musulmans." },
  { name: "Ikrimah ibn Abi Jahl", category: "Quraysh Leaders", role: "Late convert", description: "Son of Abu Jahl who later accepted Islam and served the Muslim cause.", nameAr: "عكرمة بن أبي جهل", roleAr: "أسلم متأخراً", descriptionAr: "كان ابن أبي جهل، وأسلم رضي الله عنه فيما بعد وخدم قضية المسلمين.", nameFr: "Ikrima ibn Abi Jahl", roleFr: "Converti tardif", descriptionFr: "Fils de Abou Jahl qui accepta plus tard l'islam et servit la cause musulmane." },
  { name: "Abu Sufyan ibn Harb", category: "Quraysh Leaders", role: "Quraysh leader", description: "A major leader of Quraysh who later accepted Islam.", nameAr: "أبو سفيان بن حرب", roleAr: "زعيم قرشي", descriptionAr: "كان من كبار زعماء قريش، ثم أسلم رضي الله عنه فيما بعد.", nameFr: "Abou Sufyan ibn Harb", roleFr: "Chef de Quraysh", descriptionFr: "Grand chef de Quraysh qui accepta ensuite l'islam." },
  { name: "Hind bint Utbah", category: "Quraysh Leaders", role: "Influential Qurayshi woman", description: "Initially opposed Islam but later accepted it after the conquest of Makkah.", nameAr: "هند بنت عتبة", roleAr: "امرأة قرشية ذات نفوذ", descriptionAr: "عارضت الإسلام في البداية، ثم أسلمت رضي الله عنها بعد فتح مكة.", nameFr: "Hind bint Utba", roleFr: "Femme qurayshite influente", descriptionFr: "S'opposa d'abord à l'islam, puis l'accepta après la conquête de La Mecque." },
  { name: "Mu'awiyah ibn Abi Sufyan", category: "Scribes & Administrators", role: "Companion and scribe", description: "Son of Abu Sufyan who became a scribe and later a major political figure.", nameAr: "معاوية بن أبي سفيان", roleAr: "صحابي وكاتب", descriptionAr: "كان ابن أبي سفيان، وأصبح رضي الله عنه كاتباً للوحي ثم شخصية سياسية بارزة فيما بعد.", nameFr: "Mu'awiya ibn Abi Sufyan", roleFr: "Compagnon et scribe", descriptionFr: "Fils de Abou Sufyan, devenu scribe puis figure politique majeure." },
  { name: "Wahshi ibn Harb", category: "Late Converts", role: "Former opponent", description: "Killed Hamzah at Uhud, later accepted Islam, and fought against false prophecy.", nameAr: "وحشي بن حرب", roleAr: "خصم سابق", descriptionAr: "قتل حمزة رضي الله عنه يوم أحد، ثم أسلم فيما بعد وقاتل ضد مسيلمة الكذاب.", nameFr: "Wahshi ibn Harb", roleFr: "Ancien adversaire", descriptionFr: "Tua Hamza à Uhud, accepta ensuite l'islam et combattit la fausse prophétie." },
  { name: "Safwan ibn Umayyah", category: "Quraysh Leaders", role: "Late convert", description: "A noble Qurayshi leader who eventually accepted Islam.", nameAr: "صفوان بن أمية", roleAr: "أسلم متأخراً", descriptionAr: "كان زعيماً قرشياً نبيلاً أسلم رضي الله عنه في نهاية المطاف.", nameFr: "Safwan ibn Umayya", roleFr: "Converti tardif", descriptionFr: "Noble chef qurayshite qui finit par accepter l'islam." },
  { name: "Suhayl ibn Amr", category: "Quraysh Leaders", role: "Quraysh negotiator", description: "Represented Quraysh at Hudaybiyyah and later accepted Islam.", nameAr: "سهيل بن عمرو", roleAr: "مفاوض قريش", descriptionAr: "مثّل قريشًا في صلح الحديبية ثم أسلم بعد ذلك.", nameFr: "Suhayl ibn Amr", roleFr: "Négociateur de Quraysh", descriptionFr: "Représenta Quraysh à Hudaybiyya et accepta ensuite l'islam." },
  { name: "Hakim ibn Hizam", category: "Quraysh Leaders", role: "Nobleman of Makkah", description: "A respected Qurayshi figure who later accepted Islam.", nameAr: "حكيم بن حزام", roleAr: "من وجهاء مكة", descriptionAr: "شخصية قرشية محترمة أسلمت فيما بعد.", nameFr: "Hakim ibn Hizam", roleFr: "Notable de La Mecque", descriptionFr: "Figure qurayshite respectée qui accepta ensuite l'islam." },
  { name: "Al-Tufayl ibn Amr al-Dawsi", category: "Tribal Leaders", role: "Leader from Daws", description: "Accepted Islam and called his people to the message.", nameAr: "الطفيل بن عمرو الدوسي", roleAr: "زعيم من قبيلة دوس", descriptionAr: "أسلم ودعا قومه إلى الإسلام.", nameFr: "At-Tufayl ibn Amr ad-Dawsi", roleFr: "Chef de Daws", descriptionFr: "Accepta l'islam et appela son peuple au message." },
  { name: "Abu Musa al-Ash'ari", category: "Scholars & Narrators", role: "Companion and reciter", description: "Known for his beautiful recitation and leadership.", nameAr: "أبو موسى الأشعري", roleAr: "صحابي وقارئ للقرآن", descriptionAr: "اشتهر رضي الله عنه بحسن صوته في القراءة وبقيادته.", nameFr: "Abou Musa al-Ash'ari", roleFr: "Compagnon et récitateur", descriptionFr: "Connu pour sa belle récitation et son leadership." },
  { name: "Jarir ibn Abdullah al-Bajali", category: "Tribal Leaders", role: "Late companion", description: "A respected tribal leader who accepted Islam and served the Muslim community.", nameAr: "جرير بن عبد الله البجلي", roleAr: "صحابي من متأخري الإسلام", descriptionAr: "زعيم قبلي محترم أسلم رضي الله عنه وخدم المجتمع المسلم.", nameFr: "Jarir ibn Abdullah al-Bajali", roleFr: "Compagnon tardif", descriptionFr: "Chef tribal respecté qui accepta l'islam et servit la communauté musulmane." },
  { name: "Adi ibn Hatim", category: "Tribal Leaders", role: "Former Christian Arab leader", description: "Accepted Islam after meeting the Prophet ﷺ and became an important companion.", nameAr: "عدي بن حاتم", roleAr: "زعيم عربي نصراني سابقًا", descriptionAr: "أسلم رضي الله عنه بعد لقائه بالنبي ﷺ وأصبح من الصحابة البارزين.", nameFr: "Adi ibn Hatim", roleFr: "Ancien chef arabe chrétien", descriptionFr: "Accepta l'islam après avoir rencontré le Prophète ﷺ et devint un compagnon important." },
  { name: "Dihyah al-Kalbi", category: "Rulers & Envoys", role: "Envoy of the Prophet ﷺ", description: "Sent as an envoy to the Byzantine ruler.", nameAr: "دحية الكلبي", roleAr: "رسول النبي ﷺ", descriptionAr: "أُرسل رضي الله عنه سفيرًا إلى حاكم الروم.", nameFr: "Dihya al-Kalbi", roleFr: "Envoyé du Prophète ﷺ", descriptionFr: "Envoyé comme ambassadeur auprès du souverain byzantin." },
  { name: "Al-Ala al-Hadrami", category: "Rulers & Envoys", role: "Envoy and governor", description: "Served the Prophet ﷺ in administrative and diplomatic roles.", nameAr: "العلاء الحضرمي", roleAr: "رسول ووالٍ", descriptionAr: "خدم رضي الله عنه النبي ﷺ في مهام إدارية ودبلوماسية.", nameFr: "Al-Ala al-Hadrami", roleFr: "Envoyé et gouverneur", descriptionFr: "Servit le Prophète ﷺ dans des rôles administratifs et diplomatiques." },
  { name: "Hatib ibn Abi Balta'ah", category: "Muhajirun", role: "Companion of Badr", description: "A companion involved in a major incident before the conquest of Makkah.", nameAr: "حاطب بن أبي بلتعة", roleAr: "صحابي بدري", descriptionAr: "صحابي شارك في حادثة مهمة قبل فتح مكة.", nameFr: "Hatib ibn Abi Balta'a", roleFr: "Compagnon de Badr", descriptionFr: "Compagnon impliqué dans un incident majeur avant la conquête de La Mecque." },
  { name: "Abu Lubabah ibn Abd al-Mundhir", category: "Ansar", role: "Ansari companion", description: "Known for his repentance after a serious mistake during the Madinan period.", nameAr: "أبو لبابة بن عبد المنذر", roleAr: "صحابي أنصاري", descriptionAr: "اشتهر رضي الله عنه بتوبته بعد خطأ جسيم وقع فيه في العهد المدني.", nameFr: "Abou Lubaba ibn Abd al-Mundhir", roleFr: "Compagnon ansari", descriptionFr: "Connu pour son repentir après une grave erreur à la période médinoise." },
  { name: "Abu Bakrah Nufay' ibn al-Harith", category: "Companions", role: "Companion from Ta'if", description: "Connected to the events around Ta'if and later known as a narrator.", nameAr: "أبو بكرة نفيع بن الحارث", roleAr: "صحابي من الطائف", descriptionAr: "ارتبط بأحداث الطائف واشتهر لاحقًا رضي الله عنه بروايته للحديث.", nameFr: "Abou Bakra Nufay' ibn al-Harith", roleFr: "Compagnon de Ta'if", descriptionFr: "Lié aux événements autour de Ta'if, connu ensuite comme rapporteur." },
  { name: "Al-Mughira ibn Shu'bah", category: "Companions", role: "Late companion and leader", description: "Accepted Islam and later became known for political and administrative skill.", nameAr: "المغيرة بن شعبة", roleAr: "صحابي متأخر وقائد", descriptionAr: "أسلم رضي الله عنه واشتهر لاحقًا بمهارته السياسية والإدارية.", nameFr: "Al-Mughira ibn Shu'ba", roleFr: "Compagnon tardif et chef", descriptionFr: "Accepta l'islam et se fit connaître pour son habileté politique et administrative." },
  { name: "Hamzah ibn Abd al-Muttalib", category: "Family of the Prophet ﷺ", role: "Uncle of the Prophet ﷺ", description: "A brave defender of Islam and martyr of Uhud.", nameAr: "حمزة بن عبد المطلب", roleAr: "عم النبي ﷺ", descriptionAr: "مدافع شجاع عن الإسلام واستشهد رضي الله عنه في غزوة أُحُد.", nameFr: "Hamza ibn Abd al-Muttalib", roleFr: "Oncle du Prophète ﷺ", descriptionFr: "Vaillant défenseur de l'islam et martyr d'Uhud." },
  { name: "Al-Abbas ibn Abd al-Muttalib", category: "Family of the Prophet ﷺ", role: "Uncle of the Prophet ﷺ", description: "A respected elder of Banu Hashim who later accepted Islam.", nameAr: "العباس بن عبد المطلب", roleAr: "عم النبي ﷺ", descriptionAr: "كبير محترم من بني هاشم أسلم رضي الله عنه فيما بعد.", nameFr: "Al-Abbas ibn Abd al-Muttalib", roleFr: "Oncle du Prophète ﷺ", descriptionFr: "Aîné respecté de Banu Hashim qui accepta ensuite l'islam." },
  { name: "Safiyyah bint Abd al-Muttalib", category: "Family of the Prophet ﷺ", role: "Aunt of the Prophet ﷺ", description: "Mother of al-Zubayr and a strong woman from Banu Hashim.", nameAr: "صفية بنت عبد المطلب", roleAr: "عمة النبي ﷺ", descriptionAr: "والدة الزبير بن العوام وامرأة قوية من بني هاشم رضي الله عنها.", nameFr: "Safiya bint Abd al-Muttalib", roleFr: "Tante du Prophète ﷺ", descriptionFr: "Mère d'az-Zubayr et femme forte de Banu Hashim." },
  { name: "Abu Talib ibn Abd al-Muttalib", category: "Family of the Prophet ﷺ", role: "Uncle and protector", description: "Protected the Prophet ﷺ in Makkah despite not accepting Islam.", nameAr: "أبو طالب بن عبد المطلب", roleAr: "عم النبي وحاميه", descriptionAr: "حمى النبي ﷺ في مكة رغم أنه لم يدخل في الإسلام.", nameFr: "Abou Talib ibn Abd al-Muttalib", roleFr: "Oncle et protecteur", descriptionFr: "Protéga le Prophète ﷺ à La Mecque sans accepter l'islam." },
  { name: "Abd al-Muttalib", category: "Family of the Prophet ﷺ", role: "Grandfather of the Prophet ﷺ", description: "A respected leader of Quraysh and guardian of the Prophet ﷺ in childhood.", nameAr: "عبد المطلب", roleAr: "جد النبي ﷺ", descriptionAr: "زعيم محترم من قريش وكافل النبي ﷺ في طفولته.", nameFr: "Abd al-Muttalib", roleFr: "Grand-père du Prophète ﷺ", descriptionFr: "Chef respecté de Quraysh et tuteur du Prophète ﷺ dans l'enfance." },
  { name: "Abdullah ibn Abd al-Muttalib", category: "Family of the Prophet ﷺ", role: "Father of the Prophet ﷺ", description: "Passed away before the birth of the Prophet ﷺ.", nameAr: "عبد الله بن عبد المطلب", roleAr: "والد النبي ﷺ", descriptionAr: "توفي قبل ولادة النبي ﷺ.", nameFr: "Abdullah ibn Abd al-Muttalib", roleFr: "Père du Prophète ﷺ", descriptionFr: "Décédé avant la naissance du Prophète ﷺ." },
  { name: "Aminah bint Wahb", category: "Family of the Prophet ﷺ", role: "Mother of the Prophet ﷺ", description: "Mother of the Prophet ﷺ who passed away when he was young.", nameAr: "آمنة بنت وهب", roleAr: "والدة النبي ﷺ", descriptionAr: "والدة النبي ﷺ، توفيت وهو صغير.", nameFr: "Amina bint Wahb", roleFr: "Mère du Prophète ﷺ", descriptionFr: "Mère du Prophète ﷺ, décédée lorsqu'il était jeune." },
  { name: "Halimah al-Sa'diyyah", category: "Family of the Prophet ﷺ", role: "Foster mother", description: "Nursed and cared for the Prophet ﷺ during his early childhood.", nameAr: "حليمة السعدية", roleAr: "مرضعة النبي ﷺ", descriptionAr: "أرضعت النبي ﷺ واعتنت به في طفولته المبكرة.", nameFr: "Halima as-Sa'diyya", roleFr: "Nourrice", descriptionFr: "Allaita et prit soin du Prophète ﷺ dans sa petite enfance." },
  { name: "Barakah Umm Ayman", category: "Family of the Prophet ﷺ", role: "Caregiver of the Prophet ﷺ", description: "A beloved woman who cared for the Prophet ﷺ from childhood.", nameAr: "بركة أم أيمن", roleAr: "حاضنة النبي ﷺ", descriptionAr: "امرأة محبوبة اعتنت بالنبي ﷺ منذ طفولته رضي الله عنها.", nameFr: "Baraka Oumm Ayman", roleFr: "Gardienne du Prophète ﷺ", descriptionFr: "Femme bien-aimée qui prit soin du Prophète ﷺ dès l'enfance." },
  { name: "Abu Jahl Amr ibn Hisham", category: "Opponents", role: "Major opponent in Makkah", description: "One of the fiercest enemies of the Prophet ﷺ and leader against Islam.", nameAr: "أبو جهل عمرو بن هشام", roleAr: "خصم رئيسي في مكة", descriptionAr: "من أشد أعداء النبي ﷺ وقائد الحملة ضد الإسلام في مكة.", nameFr: "Abou Jahl Amr ibn Hisham", roleFr: "Principal adversaire à La Mecque", descriptionFr: "L'un des ennemis les plus féroces du Prophète ﷺ et chef contre l'islam." },
  { name: "Abu Lahab", category: "Opponents", role: "Uncle and enemy of Islam", description: "Opposed the Prophet ﷺ harshly despite being from his own family.", nameAr: "أبو لهب", roleAr: "عم النبي وعدو للإسلام", descriptionAr: "عارض النبي ﷺ بشدة رغم كونه من أسرته.", nameFr: "Abou Lahab", roleFr: "Oncle et ennemi de l'islam", descriptionFr: "S'opposa durement au Prophète ﷺ malgré le lien familial." },
  { name: "Umm Jamil", category: "Opponents", role: "Wife of Abu Lahab", description: "Opposed the Prophet ﷺ and supported her husband's hostility.", nameAr: "أم جميل", roleAr: "زوجة أبي لهب", descriptionAr: "عارضت النبي ﷺ وساندت عداء زوجها له.", nameFr: "Oumm Jamil", roleFr: "Épouse de Abou Lahab", descriptionFr: "S'opposa au Prophète ﷺ et soutint l'hostilité de son mari." },
  { name: "Utbah ibn Rabi'ah", category: "Opponents", role: "Quraysh elder", description: "A leading opponent from Quraysh involved in early confrontations.", nameAr: "عتبة بن ربيعة", roleAr: "شيخ من قريش", descriptionAr: "من كبار معارضي قريش وشارك في المواجهات الأولى مع المسلمين.", nameFr: "Utba ibn Rabi'a", roleFr: "Ancien de Quraysh", descriptionFr: "Principal adversaire de Quraysh impliqué dans les premières confrontations." },
  { name: "Shaybah ibn Rabi'ah", category: "Opponents", role: "Quraysh leader", description: "A Qurayshi opponent involved in conflict with the Muslims.", nameAr: "شيبة بن ربيعة", roleAr: "زعيم قرشي", descriptionAr: "من خصوم قريش الذين شاركوا في الصراع مع المسلمين.", nameFr: "Shayba ibn Rabi'a", roleFr: "Chef de Quraysh", descriptionFr: "Adversaire qurayshite impliqué dans le conflit avec les musulmans." },
  { name: "Al-Walid ibn Utbah", category: "Opponents", role: "Quraysh fighter", description: "One of the Qurayshi figures connected to the Battle of Badr.", nameAr: "الوليد بن عتبة", roleAr: "مقاتل من قريش", descriptionAr: "من شخصيات قريش المرتبطة بغزوة بدر.", nameFr: "Al-Walid ibn Utba", roleFr: "Combattant de Quraysh", descriptionFr: "Figure qurayshite liée à la bataille de Badr." },
  { name: "Umayyah ibn Khalaf", category: "Opponents", role: "Persecutor of Bilal", description: "A Makkan opponent known for torturing Bilal ibn Rabah.", nameAr: "أمية بن خلف", roleAr: "مُعذِّب بلال", descriptionAr: "خصم مكي اشتهر بتعذيب بلال بن رباح رضي الله عنه.", nameFr: "Umayya ibn Khalaf", roleFr: "Persécuteur de Bilal", descriptionFr: "Adversaire mecquois connu pour avoir torturé Bilal ibn Rabah." },
  { name: "Ubayy ibn Khalaf", category: "Opponents", role: "Makkan enemy", description: "A hostile opponent of the Prophet ﷺ during the Makkan and Madinan period.", nameAr: "أُبي بن خلف", roleAr: "عدو مكي", descriptionAr: "خصم عنيد للنبي ﷺ خلال العهدين المكي والمدني.", nameFr: "Ubayy ibn Khalaf", roleFr: "Ennemi mecquois", descriptionFr: "Adversaire hostile du Prophète ﷺ aux périodes mecquoise et médinoise." },
  { name: "Al-Walid ibn al-Mughirah", category: "Opponents", role: "Quraysh elder", description: "A powerful Makkan leader who rejected the message.", nameAr: "الوليد بن المغيرة", roleAr: "شيخ من قريش", descriptionAr: "زعيم مكي قوي رفض الدعوة.", nameFr: "Al-Walid ibn al-Mughira", roleFr: "Ancien de Quraysh", descriptionFr: "Puissant chef mecquois qui rejeta le message." },
  { name: "Al-Nadr ibn al-Harith", category: "Opponents", role: "Makkan opponent", description: "Used stories and arguments to distract people from the Qur'an.", nameAr: "النضر بن الحارث", roleAr: "خصم مكي", descriptionAr: "استخدم القصص والحجج لصرف الناس عن القرآن.", nameFr: "An-Nadr ibn al-Harith", roleFr: "Adversaire mecquois", descriptionFr: "Utilisa des récits et arguments pour détourner les gens du Coran." },
  { name: "Uqbah ibn Abi Mu'ayt", category: "Opponents", role: "Makkan persecutor", description: "Known for his severe hostility toward the Prophet ﷺ.", nameAr: "عقبة بن أبي معيط", roleAr: "مضطهِد مكي", descriptionAr: "اشتهر بعدائه الشديد تجاه النبي ﷺ.", nameFr: "Uqba ibn Abi Mu'ayt", roleFr: "Persécuteur mecquois", descriptionFr: "Connu pour son hostilité sévère envers le Prophète ﷺ." },
  { name: "Mut'im ibn Adi", category: "Quraysh Leaders", role: "Makkan nobleman", description: "Though not Muslim, he gave protection to the Prophet ﷺ after Ta'if.", nameAr: "المطعم بن عدي", roleAr: "أحد وجهاء مكة", descriptionAr: "لم يكن مسلمًا لكنه أجار النبي ﷺ بعد عودته من الطائف.", nameFr: "Mut'im ibn Adi", roleFr: "Notable mecquois", descriptionFr: "Bien que non musulman, il accorda protection au Prophète ﷺ après Ta'if." },
  { name: "Abdullah ibn Ubayy ibn Salul", category: "Opponents", role: "Leader of the hypocrites", description: "A major internal opponent in Madinah who caused harm to the Muslim community.", nameAr: "عبد الله بن أبي بن سلول", roleAr: "رأس المنافقين", descriptionAr: "كان أبرز خصم داخلي في المدينة، وألحق الأذى بالمسلمين بنفاقه ومكره.", nameFr: "Abdullah ibn Ubayy ibn Salul", roleFr: "Chef des hypocrites", descriptionFr: "Principal adversaire interne à Médine, qui nuisit à la communauté musulmane." },
  { name: "Ka'b ibn al-Ashraf", category: "Opponents", role: "Enemy in Madinah", description: "A hostile figure in Madinah who opposed the Prophet ﷺ.", nameAr: "كعب بن الأشرف", roleAr: "عدو في المدينة", descriptionAr: "كان من أشد المعادين للنبي ﷺ في المدينة، وحرّض عليه بالشعر والمكيدة.", nameFr: "Ka'b ibn al-Ashraf", roleFr: "Ennemi à Médine", descriptionFr: "Figure hostile à Médine qui s'opposa au Prophète ﷺ." },
  { name: "Huyayy ibn Akhtab", category: "Opponents", role: "Tribal leader", description: "A major opponent involved in stirring hostility against the Muslims.", nameAr: "حيي بن أخطب", roleAr: "زعيم قبلي", descriptionAr: "كان من كبار زعماء يهود، وأسهم في تأليب القبائل على قتال المسلمين.", nameFr: "Huyayy ibn Akhtab", roleFr: "Chef tribal", descriptionFr: "Grand adversaire qui attisait l'hostilité contre les musulmans." },
  { name: "Salam ibn Abi al-Huqayq", category: "Opponents", role: "Opponent from Khaybar", description: "One of the hostile figures connected to plots against the Muslims.", nameAr: "سلام بن أبي الحقيق", roleAr: "خصم من خيبر", descriptionAr: "كان من زعماء يهود خيبر المعادين، وشارك في التآمر على المسلمين.", nameFr: "Salam ibn Abi al-Huqayq", roleFr: "Adversaire de Khaybar", descriptionFr: "Figure hostile liée aux complots contre les musulmans." },
  { name: "Kinana ibn al-Rabi'", category: "Opponents", role: "Figure from Khaybar", description: "A leader connected to the events of Khaybar.", nameAr: "كنانة بن الربيع", roleAr: "شخصية من خيبر", descriptionAr: "كان من زعماء يهود خيبر، وارتبط اسمه بأحداث فتح خيبر.", nameFr: "Kinana ibn ar-Rabi'", roleFr: "Figure de Khaybar", descriptionFr: "Chef lié aux événements de Khaybar." },
  { name: "Al-Najashi", category: "Rulers & Envoys", role: "Ruler of Abyssinia", description: "Gave protection to the early Muslim migrants who fled persecution.", nameAr: "النجاشي", roleAr: "ملك الحبشة", descriptionAr: "آوى المهاجرين الأوائل من المسلمين الفارّين من اضطهاد قريش وحماهم.", nameFr: "An-Najashi", roleFr: "Souverain d'Abyssinie", descriptionFr: "Accorda protection aux premiers migrants musulmans fuyant la persécution." },
  { name: "Heraclius", category: "Rulers & Envoys", role: "Byzantine emperor", description: "Received a letter from the Prophet ﷺ inviting him to Islam.", nameAr: "هرقل", roleAr: "إمبراطور الروم", descriptionAr: "تلقى رسالة من النبي ﷺ يدعوه فيها إلى الإسلام.", nameFr: "Héraclius", roleFr: "Empereur byzantin", descriptionFr: "Reçut une lettre du Prophète ﷺ l'invitant à l'islam." },
  { name: "Kisra", category: "Rulers & Envoys", role: "Persian ruler", description: "Received a letter from the Prophet ﷺ and rejected it arrogantly.", nameAr: "كسرى", roleAr: "ملك الفرس", descriptionAr: "تلقى رسالة من النبي ﷺ فمزّقها متكبرًا ورفض دعوتها.", nameFr: "Kisra", roleFr: "Souverain perse", descriptionFr: "Reçut une lettre du Prophète ﷺ et la rejeta avec arrogance." },
  { name: "Al-Muqawqis", category: "Rulers & Envoys", role: "Egyptian ruler", description: "Received the Prophet's ﷺ message and responded diplomatically.", nameAr: "المقوقس", roleAr: "حاكم مصر", descriptionAr: "تلقى رسالة النبي ﷺ وردّ عليها بأسلوب دبلوماسي لطيف.", nameFr: "Al-Muqawqis", roleFr: "Souverain d'Égypte", descriptionFr: "Reçut le message du Prophète ﷺ et répondit diplomatiquement." },
  { name: "Badhan", category: "Rulers & Envoys", role: "Persian governor in Yemen", description: "Later accepted Islam and became connected to the Prophet's ﷺ authority in Yemen.", nameAr: "باذان", roleAr: "والٍ فارسي على اليمن", descriptionAr: "أسلم فيما بعد وارتبط اسمه بولاية اليمن في عهد النبي ﷺ.", nameFr: "Badhan", roleFr: "Gouverneur perse au Yémen", descriptionFr: "Accepta ensuite l'islam et fut lié à l'autorité du Prophète ﷺ au Yémen." },
  { name: "Musaylimah al-Kadhdhab", category: "Opponents", role: "False prophet", description: "Claimed prophethood and became a major threat near the end of the Prophet's ﷺ life and after his passing.", nameAr: "مسيلمة الكذاب", roleAr: "متنبئ كاذب", descriptionAr: "ادّعى النبوة كذبًا وشكّل خطرًا كبيرًا في أواخر حياة النبي ﷺ وبعد وفاته.", nameFr: "Musaylima le Menteur", roleFr: "Faux prophète", descriptionFr: "Prétendit à la prophétie et devint une menace majeure vers la fin de la vie du Prophète ﷺ et après son décès." },
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

const CATEGORY_LABELS_AR: Record<string, string> = {
  "All": "الكل",
  "Family of the Prophet ﷺ": "أسرة النبي ﷺ",
  "Mothers of the Believers": "أمهات المؤمنين",
  "Early Muslims": "أوائل المسلمين",
  "Ten Promised Paradise": "العشرة المبشرون بالجنة",
  "Muhajirun": "المهاجرون",
  "Ansar": "الأنصار",
  "Women of the Seerah": "نساء السيرة",
  "Quraysh Leaders": "زعماء قريش",
  "Opponents": "الخصوم",
  "Rulers & Envoys": "الملوك والرسل",
  "Scholars & Narrators": "العلماء والرواة",
  "Military Figures": "القادة العسكريون",
  "Young Companions": "صغار الصحابة",
  "Tribal Leaders": "زعماء القبائل",
  "Late Converts": "متأخرو الإسلام",
  "Scribes & Administrators": "الكتّاب والإداريون",
  "Companions": "الصحابة",
};

const CATEGORY_LABELS_FR: Record<string, string> = {
  "All": "Tous",
  "Family of the Prophet ﷺ": "Famille du Prophète ﷺ",
  "Mothers of the Believers": "Mères des croyants",
  "Early Muslims": "Premiers musulmans",
  "Ten Promised Paradise": "Les dix promis au Paradis",
  "Muhajirun": "Muhajirun",
  "Ansar": "Ansar",
  "Women of the Seerah": "Femmes de la Sira",
  "Quraysh Leaders": "Chefs de Quraysh",
  "Opponents": "Adversaires",
  "Rulers & Envoys": "Souverains et envoyés",
  "Scholars & Narrators": "Savants et rapporteurs",
  "Military Figures": "Figures militaires",
  "Young Companions": "Jeunes compagnons",
  "Tribal Leaders": "Chefs tribaux",
  "Late Converts": "Convertis tardifs",
  "Scribes & Administrators": "Scribes et administrateurs",
  "Companions": "Compagnons",
};

function categoryLabel(lang: CourseLang, category: string): string {
  return loc(lang, category, CATEGORY_LABELS_AR[category] ?? category, CATEGORY_LABELS_FR[category] ?? category);
}

const INITIAL_DISPLAY_COUNT = 24;

export function KeyPeopleContent({ lang = "en" }: { lang?: CourseLang }) {
  const isRtl = lang === "ar";
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
          p.description.toLowerCase().includes(query) ||
          (p.nameAr?.includes(searchQuery.trim()) ?? false) ||
          (p.roleAr?.includes(searchQuery.trim()) ?? false) ||
          (p.descriptionAr?.includes(searchQuery.trim()) ?? false) ||
          (p.nameFr?.toLowerCase().includes(query) ?? false) ||
          (p.roleFr?.toLowerCase().includes(query) ?? false) ||
          (p.descriptionFr?.toLowerCase().includes(query) ?? false)
      );
    }

    return results;
  }, [searchQuery, selectedCategory]);

  const displayedPeople = showAll ? filteredPeople : filteredPeople.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = filteredPeople.length > INITIAL_DISPLAY_COUNT;

  return (
    <main className="min-h-screen bg-ink py-16" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Back link */}
        <Link
          href="/reference"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {loc(lang, "Back to Reference Library", "العودة إلى مكتبة المراجع", "Retour à la bibliothèque de référence")}
        </Link>

        {/* Page header */}
        <div className="mb-12">
          <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
            {loc(lang, "Reference Library", "مكتبة المراجع", "Bibliothèque de référence")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            {loc(lang, "Key People in the Seerah", "أبرز شخصيات السيرة", "Personnages clés de la Sira")}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            {loc(
              lang,
              "Companions, leaders, and figures whose roles shaped the early Muslim community.",
              "الصحابة والقادة والشخصيات التي أثّرت في تشكيل المجتمع الإسلامي الأول.",
              "Compagnons, chefs et figures dont les rôles ont façonné la première communauté musulmane."
            )}
          </p>

          {/* Important note */}
          <div className="flex gap-3 p-4 rounded-xl border border-gold/20 bg-gold-bg/30 text-sm">
            <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
            <p className="text-text-secondary leading-relaxed">
              {loc(
                lang,
                "Some figures listed were believers, some were opponents, and some were outside rulers. They are included because their roles affected the Seerah.",
                "بعض الشخصيات المدرجة كانوا مؤمنين، وبعضهم كانوا خصومًا، وبعضهم حكامًا من خارج الجزيرة العربية. وقد أُدرجوا لأن أدوارهم أثّرت في أحداث السيرة.",
                "Certaines figures listées étaient des croyants, d'autres des adversaires, d'autres encore des souverains extérieurs. Elles sont incluses parce que leurs rôles ont marqué la Sira."
              )}
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder={loc(lang, "Search people...", "ابحث عن شخصية...", "Rechercher une personne...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-11 pe-4 py-3 rounded-xl border border-border bg-surface text-text placeholder-text-muted focus:outline-none focus:border-gold/40 transition-colors"
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
                  {categoryLabel(lang, category)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 flex items-center gap-2 text-sm text-text-muted">
          <Users className="w-4 h-4" />
          <span>
            {loc(
              lang,
              `Showing ${displayedPeople.length} of ${filteredPeople.length} key figures`,
              `عرض ${displayedPeople.length} من أصل ${filteredPeople.length} من أبرز الشخصيات`,
              `Affichage de ${displayedPeople.length} sur ${filteredPeople.length} figures clés`
            )}
            {selectedCategory !== "All" || searchQuery ? (
              <> {loc(lang, "(filtered)", "(مُصفّاة)", "(filtrées)")}</>
            ) : (
              <> {loc(lang, "included", "المدرجة", "incluses")}</>
            )}
          </span>
        </div>

        {/* People grid */}
        {filteredPeople.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-secondary">
              {loc(lang, "No people found matching your search.", "لا يوجد أشخاص مطابقون لبحثك.", "Aucune personne ne correspond à votre recherche.")}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedPeople.map((person, index) => {
                const displayName = loc(lang, person.name, person.nameAr ?? person.name, person.nameFr ?? person.name);
                const initial = displayName.charAt(0).toUpperCase();
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
                          {displayName}
                        </h3>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}
                        >
                          {categoryLabel(lang, person.category)}
                        </span>
                      </div>
                    </div>

                    {/* Role */}
                    <p className="text-xs font-medium text-gold">
                      {loc(lang, person.role, person.roleAr ?? person.role, person.roleFr ?? person.role)}
                    </p>

                    {/* Description */}
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {loc(
                        lang,
                        person.description,
                        person.descriptionAr ?? person.description,
                        person.descriptionFr ?? person.description
                      )}
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
                  {showAll
                    ? loc(lang, "Show Less", "عرض أقل", "Afficher moins")
                    : loc(
                        lang,
                        `Show All ${filteredPeople.length} People`,
                        `عرض جميع الأشخاص (${filteredPeople.length})`,
                        `Afficher les ${filteredPeople.length} personnes`
                      )}
                </button>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <section className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="text-sm text-text-muted mb-1">
                {loc(lang, "Ready to go deeper?", "مستعد للمزيد؟", "Prêt à aller plus loin ?")}
              </p>
              <p className="text-base font-semibold text-text">
                {loc(
                  lang,
                  "Learn how these figures connect in the full 100-part Seerah course.",
                  "تعرّف على كيفية ارتباط هذه الشخصيات في دورة السيرة الكاملة المكوّنة من ١٠٠ جزء.",
                  "Découvrez comment ces figures s'entrelacent dans le cours complet de Sira en 100 parties."
                )}
              </p>
            </div>
            <Link
              href="/seerah"
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-ink font-semibold text-sm hover:bg-gold-light transition-colors"
            >
              {loc(lang, "Continue Learning the Seerah", "تابع تعلم السيرة النبوية", "Continuer à apprendre la Sira")}
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
            {loc(lang, "Back to Reference Library", "العودة إلى مكتبة المراجع", "Retour à la bibliothèque de référence")}
          </Link>
        </div>

      </div>
    </main>
  );
}
