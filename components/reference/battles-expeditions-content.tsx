"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Info, Swords, Flag, Shield } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";

interface Event {
  id: number;
  name: string;
  nameAr: string;
  type: string;
  typeAr: string;
  hijriYear: string;
  approximateCE?: string;
  location: string;
  locationAr: string;
  region?: string;
  regionAr?: string;
  relatedParties: string;
  relatedPartiesAr: string;
  summary: string;
  summaryAr: string;
  keyLesson: string;
  keyLessonAr: string;
  importance: "Major" | "Medium" | "Reference";
  fightingOccurred: "Yes" | "No" | "Limited" | "Siege" | "Disputed";
  categoryTags: string[];
  section: "battles" | "campaigns" | "expeditions" | "treaties";
}

const EVENTS_DATA: Event[] = [
  // MAJOR BATTLES
  {
    id: 1,
    name: "Battle of Badr",
    nameAr: "غزوة بدر",
    type: "Ghazwah / Major Battle",
    typeAr: "غزوة / معركة كبرى",
    hijriYear: "2 AH",
    approximateCE: "624 CE",
    location: "Badr",
    locationAr: "بدر",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    summary: "The first major battle between the Muslims and Quraysh.",
    summaryAr: "أول معركة كبرى بين المسلمين وقريش.",
    keyLesson: "Trust in Allah, preparation, unity, and courage.",
    keyLessonAr: "التوكل على الله، والإعداد، والوحدة، والشجاعة.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Quraysh", "Fighting Occurred", "Early Madinan Period"],
    section: "battles",
  },
  {
    id: 2,
    name: "Battle of Uhud",
    nameAr: "غزوة أُحُد",
    type: "Ghazwah / Major Battle",
    typeAr: "غزوة / معركة كبرى",
    hijriYear: "3 AH",
    approximateCE: "625 CE",
    location: "Mount Uhud, near Madinah",
    locationAr: "جبل أُحُد، قرب المدينة",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    summary: "Quraysh returned after Badr, and the Muslims faced a painful test.",
    summaryAr: "عادت قريش بعد بدر، وواجه المسلمون ابتلاءً مؤلمًا.",
    keyLesson: "Obedience, discipline, patience, and consequences of disunity.",
    keyLessonAr: "الطاعة، والانضباط، والصبر، وعواقب الفرقة.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Quraysh", "Madinah-Related", "Fighting Occurred", "Early Madinan Period"],
    section: "battles",
  },
  {
    id: 3,
    name: "Battle of the Trench / Al-Ahzab",
    nameAr: "غزوة الخندق / الأحزاب",
    type: "Ghazwah / Major Defensive Campaign",
    typeAr: "غزوة / حملة دفاعية كبرى",
    hijriYear: "5 AH",
    approximateCE: "627 CE",
    location: "Madinah",
    locationAr: "المدينة",
    relatedParties: "Muslims and the Confederates",
    relatedPartiesAr: "المسلمون والأحزاب",
    summary: "A large coalition came against Madinah, and the Muslims defended the city by digging a trench.",
    summaryAr: "زحف تحالف كبير على المدينة، فدافع المسلمون عن المدينة بحفر خندق.",
    keyLesson: "Strategy, consultation, patience, and Allah's protection.",
    keyLessonAr: "التخطيط، والشورى، والصبر، وحفظ الله.",
    importance: "Major",
    fightingOccurred: "Limited",
    categoryTags: ["Major Battles", "Ghazwah", "Madinah-Related", "Fighting Occurred", "Early Madinan Period"],
    section: "battles",
  },
  {
    id: 4,
    name: "Banu Qurayzah",
    nameAr: "بنو قريظة",
    type: "Ghazwah / Siege",
    typeAr: "غزوة / حصار",
    hijriYear: "5 AH",
    location: "Madinah",
    locationAr: "المدينة",
    relatedParties: "Muslims and Banu Qurayzah",
    relatedPartiesAr: "المسلمون وبنو قريظة",
    summary: "This event followed the Battle of the Trench and involved treaty betrayal during a time of siege.",
    summaryAr: "وقع هذا الحدث عقب غزوة الخندق، وتضمّن نقض العهد أثناء الحصار.",
    keyLesson: "Treaties, loyalty, justice, and consequences.",
    keyLessonAr: "العهود، والوفاء، والعدل، والعواقب.",
    importance: "Major",
    fightingOccurred: "Siege",
    categoryTags: ["Major Battles", "Ghazwah", "Jewish Tribes of Madinah", "Madinah-Related", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 5,
    name: "Banu Mustaliq / Al-Muraysi'",
    nameAr: "بنو المصطلق / المريسيع",
    type: "Ghazwah / Campaign",
    typeAr: "غزوة / حملة",
    hijriYear: "5 or 6 AH",
    location: "Al-Muraysi'",
    locationAr: "المريسيع",
    relatedParties: "Muslims and Banu Mustaliq",
    relatedPartiesAr: "المسلمون وبنو المصطلق",
    summary: "A campaign connected to Banu Mustaliq and important social events in the Seerah.",
    summaryAr: "حملة تتعلق ببني المصطلق وأحداث اجتماعية مهمة في السيرة.",
    keyLesson: "Community discipline, handling rumors, and leadership.",
    keyLessonAr: "انضباط المجتمع، والتعامل مع الإشاعات، والقيادة.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Fighting Occurred", "Early Madinan Period"],
    section: "battles",
  },
  {
    id: 6,
    name: "Khaybar",
    nameAr: "خيبر",
    type: "Ghazwah / Major Campaign",
    typeAr: "غزوة / حملة كبرى",
    hijriYear: "7 AH",
    approximateCE: "628 CE",
    location: "Khaybar",
    locationAr: "خيبر",
    relatedParties: "Muslims and the people of Khaybar",
    relatedPartiesAr: "المسلمون وأهل خيبر",
    summary: "A major campaign against fortified settlements north of Madinah.",
    summaryAr: "حملة كبرى ضد الحصون المنيعة شمال المدينة.",
    keyLesson: "Patience, strategy, leadership, and reliance upon Allah.",
    keyLessonAr: "الصبر، والتخطيط، والقيادة، والتوكل على الله.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Fighting Occurred", "Late Madinan Period"],
    section: "battles",
  },
  {
    id: 7,
    name: "Conquest of Makkah",
    nameAr: "فتح مكة",
    type: "Ghazwah / Opening of Makkah",
    typeAr: "غزوة / فتح مكة",
    hijriYear: "8 AH",
    approximateCE: "630 CE",
    location: "Makkah",
    locationAr: "مكة",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    summary: "The Prophet ﷺ entered Makkah victoriously after Quraysh's treaty violation.",
    summaryAr: "دخل النبي ﷺ مكة فاتحًا بعد نقض قريش للعهد.",
    keyLesson: "Mercy, forgiveness, humility, and the victory of truth.",
    keyLessonAr: "الرحمة، والعفو، والتواضع، وانتصار الحق.",
    importance: "Major",
    fightingOccurred: "Limited",
    categoryTags: ["Major Battles", "Ghazwah", "Makkah-Related", "Quraysh", "Late Madinan Period"],
    section: "battles",
  },
  {
    id: 8,
    name: "Battle of Hunayn",
    nameAr: "غزوة حنين",
    type: "Ghazwah / Major Battle",
    typeAr: "غزوة / معركة كبرى",
    hijriYear: "8 AH",
    approximateCE: "630 CE",
    location: "Hunayn",
    locationAr: "حنين",
    relatedParties: "Muslims, Hawazin, and Thaqif",
    relatedPartiesAr: "المسلمون وهوازن وثقيف",
    summary: "A major battle shortly after the conquest of Makkah.",
    summaryAr: "معركة كبرى وقعت بُعيد فتح مكة.",
    keyLesson: "Do not rely on numbers; victory comes from Allah.",
    keyLessonAr: "لا تعتمد على كثرة العدد؛ فالنصر من عند الله.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Fighting Occurred", "Late Madinan Period"],
    section: "battles",
  },
  {
    id: 9,
    name: "Siege of Ta'if",
    nameAr: "حصار الطائف",
    type: "Ghazwah / Siege",
    typeAr: "غزوة / حصار",
    hijriYear: "8 AH",
    approximateCE: "630 CE",
    location: "Ta'if",
    locationAr: "الطائف",
    relatedParties: "Muslims and Thaqif",
    relatedPartiesAr: "المسلمون وثقيف",
    summary: "The Muslims moved toward Ta'if after Hunayn.",
    summaryAr: "توجّه المسلمون إلى الطائف بعد حنين.",
    keyLesson: "Patience, restraint, and leaving guidance to Allah.",
    keyLessonAr: "الصبر، وضبط النفس، وتفويض الهداية لله.",
    importance: "Major",
    fightingOccurred: "Siege",
    categoryTags: ["Major Battles", "Ghazwah", "Late Madinan Period"],
    section: "campaigns",
  },

  // MAJOR CAMPAIGNS AND SIEGES
  {
    id: 10,
    name: "Banu Qaynuqa",
    nameAr: "بنو قينقاع",
    type: "Ghazwah / Madinan Campaign",
    typeAr: "غزوة / حملة مدنية",
    hijriYear: "2 AH",
    location: "Madinah",
    locationAr: "المدينة",
    relatedParties: "Muslims and Banu Qaynuqa",
    relatedPartiesAr: "المسلمون وبنو قينقاع",
    summary: "One of the early Madinan treaty-related conflicts.",
    summaryAr: "أحد أولى النزاعات المتعلقة بالعهود في المدينة.",
    keyLesson: "Community security and treaty responsibility.",
    keyLessonAr: "أمن المجتمع والمسؤولية تجاه العهود.",
    importance: "Medium",
    fightingOccurred: "Siege",
    categoryTags: ["Ghazwah", "Jewish Tribes of Madinah", "Madinah-Related", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 11,
    name: "Sawiq Campaign",
    nameAr: "غزوة السويق",
    type: "Ghazwah / Pursuit Campaign",
    typeAr: "غزوة / حملة مطاردة",
    hijriYear: "2 AH",
    location: "Around Madinah",
    locationAr: "حول المدينة",
    relatedParties: "Muslims and Abu Sufyan's party",
    relatedPartiesAr: "المسلمون وجماعة أبي سفيان",
    summary: "A pursuit after an attack connected to Quraysh hostility.",
    summaryAr: "مطاردة عقب هجوم مرتبط بعداء قريش.",
    keyLesson: "Readiness and protection of the community.",
    keyLessonAr: "الاستعداد وحماية المجتمع.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Ghazwah", "Quraysh", "Madinah-Related", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 12,
    name: "Dhu Amarr / Ghatafan Campaign",
    nameAr: "غزوة ذي أمر / غطفان",
    type: "Ghazwah",
    typeAr: "غزوة",
    hijriYear: "3 AH",
    location: "Najd region",
    locationAr: "منطقة نجد",
    relatedParties: "Muslims and Ghatafan-related groups",
    relatedPartiesAr: "المسلمون وجماعات مرتبطة بغطفان",
    summary: "A campaign connected to threats from Najd.",
    summaryAr: "حملة مرتبطة بتهديدات قادمة من نجد.",
    keyLesson: "Deterrence and vigilance.",
    keyLessonAr: "الردع واليقظة.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 13,
    name: "Bahran Campaign",
    nameAr: "غزوة بحران",
    type: "Ghazwah",
    typeAr: "غزوة",
    hijriYear: "3 AH",
    location: "Bahran",
    locationAr: "بحران",
    relatedParties: "Muslims and tribal groups",
    relatedPartiesAr: "المسلمون وجماعات قبلية",
    summary: "A campaign during the early Madinan period.",
    summaryAr: "حملة خلال العهد المدني المبكر.",
    keyLesson: "Monitoring threats and maintaining security.",
    keyLessonAr: "مراقبة التهديدات والحفاظ على الأمن.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 14,
    name: "Hamra al-Asad",
    nameAr: "حمراء الأسد",
    type: "Ghazwah / Pursuit Campaign",
    typeAr: "غزوة / حملة مطاردة",
    hijriYear: "3 AH",
    location: "Near Madinah",
    locationAr: "قرب المدينة",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    summary: "The Muslims pursued Quraysh after Uhud to show strength and prevent another attack.",
    summaryAr: "طارد المسلمون قريشًا بعد أُحُد لإظهار القوة ومنع هجوم آخر.",
    keyLesson: "Resilience after hardship.",
    keyLessonAr: "الصمود بعد الشدة.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Quraysh", "Madinah-Related", "No Fighting", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 15,
    name: "Banu Nadir",
    nameAr: "بنو النضير",
    type: "Ghazwah / Siege",
    typeAr: "غزوة / حصار",
    hijriYear: "4 AH",
    location: "Madinah",
    locationAr: "المدينة",
    relatedParties: "Muslims and Banu Nadir",
    relatedPartiesAr: "المسلمون وبنو النضير",
    summary: "A major Madinan treaty-related event that led to the removal of Banu Nadir.",
    summaryAr: "حدث مدني كبير متعلق بالعهود أدى إلى إجلاء بني النضير.",
    keyLesson: "Treaty responsibility and internal security.",
    keyLessonAr: "المسؤولية تجاه العهود والأمن الداخلي.",
    importance: "Major",
    fightingOccurred: "Siege",
    categoryTags: ["Ghazwah", "Jewish Tribes of Madinah", "Madinah-Related", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 16,
    name: "Dhat al-Riqa'",
    nameAr: "غزوة ذات الرقاع",
    type: "Ghazwah",
    typeAr: "غزوة",
    hijriYear: "4 or 5 AH",
    location: "Najd region",
    locationAr: "منطقة نجد",
    relatedParties: "Muslims and tribal groups",
    relatedPartiesAr: "المسلمون وجماعات قبلية",
    summary: "A campaign connected to threats from tribes in the Najd region.",
    summaryAr: "حملة مرتبطة بتهديدات من قبائل منطقة نجد.",
    keyLesson: "Prayer in danger, readiness, and discipline.",
    keyLessonAr: "الصلاة وقت الخوف، والاستعداد، والانضباط.",
    importance: "Medium",
    fightingOccurred: "Limited",
    categoryTags: ["Ghazwah", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 17,
    name: "Dumat al-Jandal",
    nameAr: "دومة الجندل",
    type: "Ghazwah",
    typeAr: "غزوة",
    hijriYear: "5 AH",
    location: "Northern Arabia",
    locationAr: "شمال الجزيرة العربية",
    relatedParties: "Muslims and northern tribal groups",
    relatedPartiesAr: "المسلمون وجماعات قبلية شمالية",
    summary: "A northern campaign connected to securing routes and responding to threats.",
    summaryAr: "حملة شمالية لتأمين الطرق والرد على التهديدات.",
    keyLesson: "Strategic reach and protecting the community.",
    keyLessonAr: "الامتداد الاستراتيجي وحماية المجتمع.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 18,
    name: "Banu Lahyan",
    nameAr: "بنو لحيان",
    type: "Ghazwah",
    typeAr: "غزوة",
    hijriYear: "6 AH",
    location: "Region connected to Hudhayl",
    locationAr: "منطقة مرتبطة بهذيل",
    relatedParties: "Muslims and Banu Lahyan",
    relatedPartiesAr: "المسلمون وبنو لحيان",
    summary: "A campaign connected to earlier harm suffered by Muslim teachers and envoys.",
    summaryAr: "حملة مرتبطة بأذى سابق لحق بمعلمين ومبعوثين مسلمين.",
    keyLesson: "Justice, memory, and caution in da'wah missions.",
    keyLessonAr: "العدل، والذاكرة، والحذر في بعثات الدعوة.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Late Madinan Period"],
    section: "campaigns",
  },
  {
    id: 19,
    name: "Dhu Qarad / Al-Ghabah",
    nameAr: "ذو قرد / الغابة",
    type: "Ghazwah / Pursuit Campaign",
    typeAr: "غزوة / حملة مطاردة",
    hijriYear: "6 AH",
    location: "Near Madinah",
    locationAr: "قرب المدينة",
    relatedParties: "Muslims and raiders",
    relatedPartiesAr: "المسلمون والمغيرون",
    summary: "A pursuit after livestock were attacked near Madinah.",
    summaryAr: "مطاردة عقب الإغارة على الماشية قرب المدينة.",
    keyLesson: "Quick response and community protection.",
    keyLessonAr: "سرعة الاستجابة وحماية المجتمع.",
    importance: "Medium",
    fightingOccurred: "Limited",
    categoryTags: ["Ghazwah", "Madinah-Related", "Late Madinan Period"],
    section: "campaigns",
  },
  {
    id: 20,
    name: "Hudaybiyyah",
    nameAr: "الحديبية",
    type: "Ghazwah / Treaty Event",
    typeAr: "غزوة / حدث معاهدة",
    hijriYear: "6 AH",
    approximateCE: "628 CE",
    location: "Hudaybiyyah, near Makkah",
    locationAr: "الحديبية، قرب مكة",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    summary: "The Muslims set out for Umrah but were prevented, leading to the Treaty of Hudaybiyyah.",
    summaryAr: "خرج المسلمون لأداء العمرة فمُنعوا، مما أدى إلى صلح الحديبية.",
    keyLesson: "Long-term wisdom, patience, and strategic peace.",
    keyLessonAr: "الحكمة بعيدة المدى، والصبر، والسلام الاستراتيجي.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Treaty Events", "Makkah-Related", "Quraysh", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
  {
    id: 21,
    name: "Umrat al-Qada",
    nameAr: "عمرة القضاء",
    type: "Journey / Fulfilled Umrah",
    typeAr: "رحلة / عمرة مقضية",
    hijriYear: "7 AH",
    location: "Makkah",
    locationAr: "مكة",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    summary: "The Muslims returned to perform the Umrah they had been prevented from performing the year before.",
    summaryAr: "عاد المسلمون لأداء العمرة التي مُنعوا منها في العام السابق.",
    keyLesson: "Patience and fulfillment of agreements.",
    keyLessonAr: "الصبر والوفاء بالعهود.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Makkah-Related", "Quraysh", "Treaty Events", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
  {
    id: 22,
    name: "Tabuk",
    nameAr: "غزوة تبوك",
    type: "Ghazwah / Major Expedition",
    typeAr: "غزوة / حملة كبرى",
    hijriYear: "9 AH",
    approximateCE: "630 CE",
    location: "Tabuk",
    locationAr: "تبوك",
    relatedParties: "Muslims and northern Byzantine-linked threat",
    relatedPartiesAr: "المسلمون وتهديد شمالي مرتبط بالروم",
    summary: "One of the last major expeditions in the Prophet's ﷺ life.",
    summaryAr: "من آخر الغزوات الكبرى في حياة النبي ﷺ.",
    keyLesson: "Sacrifice, sincerity, hardship, and exposing hypocrisy.",
    keyLessonAr: "التضحية، والإخلاص، والمشقة، وكشف النفاق.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Late Madinan Period"],
    section: "campaigns",
  },

  // KEY EXPEDITIONS AND PATROLS
  {
    id: 23,
    name: "Expedition of Hamzah ibn Abd al-Muttalib",
    nameAr: "سرية حمزة بن عبد المطلب",
    type: "Sariyyah / Patrol",
    typeAr: "سرية / دورية",
    hijriYear: "1 AH",
    location: "Toward the Red Sea route",
    locationAr: "باتجاه طريق البحر الأحمر",
    relatedParties: "Muslims and Quraysh caravan route",
    relatedPartiesAr: "المسلمون وطريق قوافل قريش",
    summary: "One of the earliest Muslim patrols after the Hijrah.",
    summaryAr: "من أولى دوريات المسلمين بعد الهجرة.",
    keyLesson: "Establishing presence and protecting the new community.",
    keyLessonAr: "تثبيت الوجود وحماية المجتمع الناشئ.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Sariyyah", "Quraysh", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 24,
    name: "Expedition of Ubaydah ibn al-Harith",
    nameAr: "سرية عبيدة بن الحارث",
    type: "Sariyyah / Patrol",
    typeAr: "سرية / دورية",
    hijriYear: "1 AH",
    location: "Rabigh area",
    locationAr: "منطقة رابغ",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    summary: "An early patrol during the first year after Hijrah.",
    summaryAr: "دورية مبكرة خلال السنة الأولى بعد الهجرة.",
    keyLesson: "Early defense and organized leadership.",
    keyLessonAr: "الدفاع المبكر والقيادة المنظمة.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Quraysh", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 25,
    name: "Expedition of Sa'd ibn Abi Waqqas to al-Kharrar",
    nameAr: "سرية سعد بن أبي وقاص إلى الخرار",
    type: "Sariyyah / Patrol",
    typeAr: "سرية / دورية",
    hijriYear: "1 AH",
    location: "Al-Kharrar",
    locationAr: "الخرار",
    relatedParties: "Muslims and Quraysh caravan route",
    relatedPartiesAr: "المسلمون وطريق قوافل قريش",
    summary: "An early patrol led by Sa'd ibn Abi Waqqas رضي الله عنه.",
    summaryAr: "دورية مبكرة بقيادة سعد بن أبي وقاص رضي الله عنه.",
    keyLesson: "Readiness and discipline.",
    keyLessonAr: "الاستعداد والانضباط.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Sariyyah", "Quraysh", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 26,
    name: "Al-Abwa / Waddan",
    nameAr: "الأبواء / ودان",
    type: "Ghazwah",
    typeAr: "غزوة",
    hijriYear: "1 AH",
    location: "Al-Abwa / Waddan",
    locationAr: "الأبواء / ودان",
    relatedParties: "Muslims and local tribal groups",
    relatedPartiesAr: "المسلمون وجماعات قبلية محلية",
    summary: "One of the earliest campaigns the Prophet ﷺ personally went out on.",
    summaryAr: "من أولى الغزوات التي خرج فيها النبي ﷺ بنفسه.",
    keyLesson: "Establishing treaties and presence outside Madinah.",
    keyLessonAr: "عقد المعاهدات وتثبيت الوجود خارج المدينة.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 27,
    name: "Buwat",
    nameAr: "غزوة بواط",
    type: "Ghazwah",
    typeAr: "غزوة",
    hijriYear: "2 AH",
    location: "Buwat",
    locationAr: "بواط",
    relatedParties: "Muslims and Quraysh caravan route",
    relatedPartiesAr: "المسلمون وطريق قوافل قريش",
    summary: "A campaign connected to Quraysh caravan movement.",
    summaryAr: "حملة مرتبطة بتحركات قوافل قريش.",
    keyLesson: "Strategic pressure and community security.",
    keyLessonAr: "الضغط الاستراتيجي وأمن المجتمع.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Quraysh", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 28,
    name: "Al-Ushayrah",
    nameAr: "غزوة العشيرة",
    type: "Ghazwah",
    typeAr: "غزوة",
    hijriYear: "2 AH",
    location: "Al-Ushayrah",
    locationAr: "العشيرة",
    relatedParties: "Muslims and Quraysh caravan route",
    relatedPartiesAr: "المسلمون وطريق قوافل قريش",
    summary: "A campaign before Badr connected to Quraysh caravan activity.",
    summaryAr: "حملة قبل بدر مرتبطة بنشاط قوافل قريش.",
    keyLesson: "Monitoring threats and economic pressure.",
    keyLessonAr: "مراقبة التهديدات والضغط الاقتصادي.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Quraysh", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 29,
    name: "First Badr / Safwan",
    nameAr: "بدر الأولى / سفوان",
    type: "Ghazwah / Pursuit",
    typeAr: "غزوة / مطاردة",
    hijriYear: "2 AH",
    location: "Badr area",
    locationAr: "منطقة بدر",
    relatedParties: "Muslims and Karaz ibn Jabir",
    relatedPartiesAr: "المسلمون وكرز بن جابر",
    summary: "A pursuit before the major Battle of Badr.",
    summaryAr: "مطاردة سبقت معركة بدر الكبرى.",
    keyLesson: "Protecting Madinah and responding to attacks.",
    keyLessonAr: "حماية المدينة والرد على الهجمات.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Madinah-Related", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 30,
    name: "Nakhlah",
    nameAr: "سرية نخلة",
    type: "Sariyyah",
    typeAr: "سرية",
    hijriYear: "2 AH",
    location: "Nakhlah",
    locationAr: "نخلة",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    summary: "A serious early expedition before Badr that raised important legal and ethical questions.",
    summaryAr: "سرية مبكرة مهمة قبل بدر أثارت مسائل شرعية وأخلاقية مهمة.",
    keyLesson: "Obedience, sacred limits, and revelation-guided correction.",
    keyLessonAr: "الطاعة، وحرمة الأشهر الحرم، والتصحيح بالوحي.",
    importance: "Medium",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Quraysh", "Fighting Occurred", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 31,
    name: "Al-Qaradah",
    nameAr: "غزوة القردة",
    type: "Sariyyah",
    typeAr: "سرية",
    hijriYear: "3 AH",
    location: "Najd trade route",
    locationAr: "طريق تجارة نجد",
    relatedParties: "Muslims and Quraysh caravan",
    relatedPartiesAr: "المسلمون وقافلة قريش",
    summary: "A mission that affected Quraysh's trade route after Badr.",
    summaryAr: "مهمة أثّرت على طريق تجارة قريش بعد بدر.",
    keyLesson: "Strategic pressure and changing power dynamics.",
    keyLessonAr: "الضغط الاستراتيجي وتغيّر موازين القوى.",
    importance: "Medium",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Quraysh", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 32,
    name: "Qatan",
    nameAr: "سرية قطن",
    type: "Sariyyah",
    typeAr: "سرية",
    hijriYear: "4 AH",
    location: "Qatan",
    locationAr: "قطن",
    relatedParties: "Muslims and Banu Asad-related threat",
    relatedPartiesAr: "المسلمون وتهديد مرتبط ببني أسد",
    summary: "A mission connected to reports of tribal threat.",
    summaryAr: "مهمة مرتبطة بتقارير عن تهديد قبلي.",
    keyLesson: "Preventive security and intelligence.",
    keyLessonAr: "الأمن الوقائي والاستخبارات.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 33,
    name: "Abdullah ibn Unays Mission",
    nameAr: "سرية عبد الله بن أنيس",
    type: "Sariyyah / Targeted Mission",
    typeAr: "سرية / مهمة محددة الهدف",
    hijriYear: "4 AH",
    location: "Outside Madinah",
    locationAr: "خارج المدينة",
    relatedParties: "Muslims and hostile tribal leadership",
    relatedPartiesAr: "المسلمون وقيادة قبلية معادية",
    summary: "A mission connected to a threat against Madinah.",
    summaryAr: "مهمة مرتبطة بتهديد ضد المدينة.",
    keyLesson: "Leadership, risk, and protection.",
    keyLessonAr: "القيادة، والمخاطرة، والحماية.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Madinah-Related", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 34,
    name: "Al-Raji'",
    nameAr: "سرية الرجيع",
    type: "Sariyyah / Da'wah Mission",
    typeAr: "سرية / بعثة دعوية",
    hijriYear: "4 AH",
    location: "Al-Raji'",
    locationAr: "الرجيع",
    relatedParties: "Muslim teachers and hostile tribes",
    relatedPartiesAr: "معلمون مسلمون وقبائل معادية",
    summary: "A tragic mission where Muslim teachers were betrayed.",
    summaryAr: "بعثة مأساوية غُدر فيها بالمعلمين المسلمين.",
    keyLesson: "Sacrifice, betrayal, and the danger faced by callers to Islam.",
    keyLessonAr: "التضحية، والغدر، وخطورة ما يواجهه الدعاة إلى الإسلام.",
    importance: "Medium",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Fighting Occurred", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 35,
    name: "Bi'r Ma'unah",
    nameAr: "بئر معونة",
    type: "Sariyyah / Da'wah Mission",
    typeAr: "سرية / بعثة دعوية",
    hijriYear: "4 AH",
    location: "Bi'r Ma'unah",
    locationAr: "بئر معونة",
    relatedParties: "Muslim teachers and hostile tribes",
    relatedPartiesAr: "معلمون مسلمون وقبائل معادية",
    summary: "A tragic event where many Qur'an reciters were killed.",
    summaryAr: "حدث مأساوي قُتل فيه عدد كبير من قرّاء القرآن.",
    keyLesson: "Sacrifice, grief, and the cost of da'wah.",
    keyLessonAr: "التضحية، والحزن، وثمن الدعوة.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Fighting Occurred", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 36,
    name: "Abu Salamah Expedition to Qatan",
    nameAr: "سرية أبي سلمة إلى قطن",
    type: "Sariyyah",
    typeAr: "سرية",
    hijriYear: "4 AH",
    location: "Qatan",
    locationAr: "قطن",
    relatedParties: "Muslims and Banu Asad-related groups",
    relatedPartiesAr: "المسلمون وجماعات مرتبطة ببني أسد",
    summary: "A mission responding to tribal threat.",
    summaryAr: "مهمة للرد على تهديد قبلي.",
    keyLesson: "Community protection and response to danger.",
    keyLessonAr: "حماية المجتمع والاستجابة للخطر.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 37,
    name: "Zayd ibn Harithah Expeditions",
    nameAr: "سرايا زيد بن حارثة",
    type: "Sariyyah",
    typeAr: "سرية",
    hijriYear: "Multiple missions",
    location: "Various routes",
    locationAr: "طرق متعددة",
    relatedParties: "Muslims and hostile groups",
    relatedPartiesAr: "المسلمون وجماعات معادية",
    summary: "Zayd ibn Harithah رضي الله عنه led multiple missions during the Madinan period.",
    summaryAr: "قاد زيد بن حارثة رضي الله عنه عدة سرايا خلال العهد المدني.",
    keyLesson: "Trusted leadership and service.",
    keyLessonAr: "القيادة الموثوقة والخدمة.",
    importance: "Reference",
    fightingOccurred: "Disputed",
    categoryTags: ["Sariyyah", "Early Madinan Period", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 38,
    name: "Dhat al-Salasil",
    nameAr: "ذات السلاسل",
    type: "Sariyyah",
    typeAr: "سرية",
    hijriYear: "8 AH",
    location: "Northern Arabia",
    locationAr: "شمال الجزيرة العربية",
    relatedParties: "Muslims and northern tribes",
    relatedPartiesAr: "المسلمون وقبائل شمالية",
    summary: "An expedition led by Amr ibn al-As رضي الله عنه.",
    summaryAr: "سرية بقيادة عمرو بن العاص رضي الله عنه.",
    keyLesson: "Leadership, obedience, and unity among commanders.",
    keyLessonAr: "القيادة، والطاعة، والوحدة بين القادة.",
    importance: "Medium",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 39,
    name: "Mu'tah",
    nameAr: "مؤتة",
    type: "Major Expedition / Usually called Ghazwah",
    typeAr: "حملة كبرى / تُسمى غالبًا غزوة",
    hijriYear: "8 AH",
    approximateCE: "629 CE",
    location: "Mu'tah",
    locationAr: "مؤتة",
    relatedParties: "Muslims and Byzantine-allied forces",
    relatedPartiesAr: "المسلمون وقوات موالية للروم",
    summary: "A major battle outside Arabia led by Zayd ibn Harithah, Ja'far ibn Abi Talib, and Abdullah ibn Rawahah رضي الله عنهم.",
    summaryAr: "معركة كبرى خارج الجزيرة العربية بقيادة زيد بن حارثة وجعفر بن أبي طالب وعبد الله بن رواحة رضي الله عنهم.",
    keyLesson: "Courage, sacrifice, and leadership succession.",
    keyLessonAr: "الشجاعة، والتضحية، وتسلسل القيادة.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Ghazwah", "Fighting Occurred", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 40,
    name: "Expedition of Khalid ibn al-Walid to Banu Jadhimah",
    nameAr: "سرية خالد بن الوليد إلى بني جذيمة",
    type: "Sariyyah",
    typeAr: "سرية",
    hijriYear: "8 AH",
    location: "Banu Jadhimah",
    locationAr: "بنو جذيمة",
    relatedParties: "Muslims and Banu Jadhimah",
    relatedPartiesAr: "المسلمون وبنو جذيمة",
    summary: "A serious incident after the conquest of Makkah.",
    summaryAr: "حادثة خطيرة وقعت بعد فتح مكة.",
    keyLesson: "Restraint, justice, and correcting mistakes.",
    keyLessonAr: "ضبط النفس، والعدل، وتصحيح الأخطاء.",
    importance: "Medium",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Fighting Occurred", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 41,
    name: "Expedition of Ali ibn Abi Talib to Yemen",
    nameAr: "سرية علي بن أبي طالب إلى اليمن",
    type: "Sariyyah / Da'wah and Governance Mission",
    typeAr: "سرية / بعثة دعوة وحكم",
    hijriYear: "10 AH",
    location: "Yemen",
    locationAr: "اليمن",
    relatedParties: "Muslims and Yemeni tribes",
    relatedPartiesAr: "المسلمون وقبائل اليمن",
    summary: "Ali رضي الله عنه was sent to Yemen for da'wah and judgment.",
    summaryAr: "أُرسل علي رضي الله عنه إلى اليمن للدعوة والقضاء.",
    keyLesson: "Teaching, justice, and spreading Islam with knowledge.",
    keyLessonAr: "التعليم، والعدل، ونشر الإسلام بالعلم.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Sariyyah", "No Fighting", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 42,
    name: "Expedition of Usamah ibn Zayd",
    nameAr: "سرية أسامة بن زيد",
    type: "Sariyyah / Final Ordered Expedition",
    typeAr: "سرية / آخر بعثة أمر بها النبي ﷺ",
    hijriYear: "11 AH",
    location: "Toward the Syrian frontier",
    locationAr: "باتجاه الحدود الشامية",
    relatedParties: "Muslims and northern frontier threat",
    relatedPartiesAr: "المسلمون وتهديد على الحدود الشمالية",
    summary: "The Prophet ﷺ appointed Usamah ibn Zayd رضي الله عنه to lead an army near the end of his life.",
    summaryAr: "عيّن النبي ﷺ أسامة بن زيد رضي الله عنه لقيادة جيش قرب نهاية حياته.",
    keyLesson: "Trusting young leadership and obeying prophetic instruction.",
    keyLessonAr: "الثقة بالقيادة الشابة وطاعة توجيه النبي ﷺ.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Sariyyah", "No Fighting", "Late Madinan Period"],
    section: "expeditions",
  },
];

const TREATY_EVENTS: Event[] = [
  {
    id: 101,
    name: "Constitution of Madinah",
    nameAr: "وثيقة المدينة",
    type: "Community Agreement",
    typeAr: "ميثاق مجتمعي",
    hijriYear: "1 AH",
    location: "Madinah",
    locationAr: "المدينة",
    relatedParties: "Muslims, Jewish tribes, and other Madinan groups",
    relatedPartiesAr: "المسلمون واليهود وجماعات مدنية أخرى",
    summary: "A foundational agreement organizing the Madinan community.",
    summaryAr: "ميثاق تأسيسي نظّم المجتمع المدني.",
    keyLesson: "Governance, rights, duties, and social order.",
    keyLessonAr: "الحكم، والحقوق، والواجبات، والنظام الاجتماعي.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Treaty Events", "Madinah-Related", "Jewish Tribes of Madinah", "No Fighting", "Early Madinan Period"],
    section: "treaties",
  },
  {
    id: 102,
    name: "Treaty of Hudaybiyyah",
    nameAr: "صلح الحديبية",
    type: "Treaty",
    typeAr: "معاهدة",
    hijriYear: "6 AH",
    location: "Hudaybiyyah",
    locationAr: "الحديبية",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    summary: "A peace treaty that appeared difficult but became a clear opening for Islam.",
    summaryAr: "معاهدة سلام بدت صعبة لكنها أصبحت فتحًا واضحًا للإسلام.",
    keyLesson: "Strategic patience and trust in Allah's plan.",
    keyLessonAr: "الصبر الاستراتيجي والثقة بتدبير الله.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Treaty Events", "Makkah-Related", "Quraysh", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
  {
    id: 103,
    name: "Letters to Rulers",
    nameAr: "الرسائل إلى الملوك",
    type: "Diplomatic Mission",
    typeAr: "بعثة دبلوماسية",
    hijriYear: "6–7 AH",
    location: "Arabia and beyond",
    locationAr: "الجزيرة العربية وما وراءها",
    relatedParties: "Regional rulers and empires",
    relatedPartiesAr: "حكام وإمبراطوريات المنطقة",
    summary: "The Prophet ﷺ sent letters inviting rulers to Islam.",
    summaryAr: "أرسل النبي ﷺ رسائل يدعو فيها الملوك إلى الإسلام.",
    keyLesson: "Global da'wah and confident leadership.",
    keyLessonAr: "الدعوة العالمية والقيادة الواثقة.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Treaty Events", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
  {
    id: 104,
    name: "Year of Delegations",
    nameAr: "عام الوفود",
    type: "Delegations / Diplomacy",
    typeAr: "وفود / دبلوماسية",
    hijriYear: "9 AH",
    location: "Madinah",
    locationAr: "المدينة",
    relatedParties: "Arab tribes",
    relatedPartiesAr: "القبائل العربية",
    summary: "Tribes from across Arabia came to Madinah to meet the Prophet ﷺ.",
    summaryAr: "قدمت قبائل من أنحاء الجزيرة العربية إلى المدينة للقاء النبي ﷺ.",
    keyLesson: "Islam spreading through teaching, leadership, and diplomacy.",
    keyLessonAr: "انتشار الإسلام عبر التعليم والقيادة والدبلوماسية.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Treaty Events", "Madinah-Related", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
];

const ALL_EVENTS = [...EVENTS_DATA, ...TREATY_EVENTS];

const FILTER_CATEGORIES = [
  "All",
  "Major Battles",
  "Ghazwah",
  "Sariyyah",
  "Makkah-Related",
  "Madinah-Related",
  "Quraysh",
  "Jewish Tribes of Madinah",
  "Treaty Events",
  "No Fighting",
  "Fighting Occurred",
  "Early Madinan Period",
  "Late Madinan Period",
];

const CATEGORY_LABELS_AR: Record<string, string> = {
  "All": "الكل",
  "Major Battles": "المعارك الكبرى",
  "Ghazwah": "غزوة",
  "Sariyyah": "سرية",
  "Makkah-Related": "متعلق بمكة",
  "Madinah-Related": "متعلق بالمدينة",
  "Quraysh": "قريش",
  "Jewish Tribes of Madinah": "يهود المدينة",
  "Treaty Events": "أحداث المعاهدات",
  "No Fighting": "بلا قتال",
  "Fighting Occurred": "وقع فيه قتال",
  "Early Madinan Period": "العهد المدني المبكر",
  "Late Madinan Period": "العهد المدني المتأخر",
};

const IMPORTANCE_LABELS_AR: Record<string, string> = {
  "Major": "رئيسي",
  "Medium": "متوسط",
  "Reference": "مرجعي",
};

const FIGHTING_LABELS_AR: Record<string, string> = {
  "Yes": "وقع قتال",
  "No": "لا قتال",
  "Limited": "محدود",
  "Siege": "حصار",
  "Disputed": "مختلف فيه",
};

function getFightingLabel(fightingOccurred: Event["fightingOccurred"], isRtl: boolean) {
  if (isRtl) {
    return FIGHTING_LABELS_AR[fightingOccurred] ?? fightingOccurred;
  }
  return fightingOccurred === "Yes"
    ? "Fighting"
    : fightingOccurred === "No"
    ? "No Fighting"
    : fightingOccurred;
}

const CALLOUT_CARDS = [
  {
    id: "c1",
    title: "Ghazwah vs Sariyyah",
    titleAr: "الغزوة والسرية",
    text: "A Ghazwah is an expedition the Prophet ﷺ personally went out on. A Sariyyah is an expedition sent by the Prophet ﷺ but led by a companion.",
    textAr: "الغزوة هي الحملة التي خرج فيها النبي ﷺ بنفسه. أما السرية فهي الحملة التي أرسلها النبي ﷺ بقيادة أحد الصحابة.",
  },
  {
    id: "c2",
    title: "Not every expedition involved fighting",
    titleAr: "ليست كل الحملات فيها قتال",
    text: "Many campaigns were patrols, treaty missions, deterrence efforts, da'wah missions, or strategic movements where no major battle occurred.",
    textAr: "كانت كثير من الحملات دوريات، أو بعثات لعقد المعاهدات، أو جهود ردع، أو بعثات دعوية، أو تحركات استراتيجية لم يقع فيها قتال كبير.",
  },
  {
    id: "c3",
    title: "Why Badr mattered",
    titleAr: "لماذا كانت بدر مهمة",
    text: "Badr was the first major battle and became a turning point for the Muslim community in Madinah.",
    textAr: "كانت بدر أول معركة كبرى، وأصبحت نقطة تحول لمجتمع المسلمين في المدينة.",
  },
  {
    id: "c4",
    title: "Why Uhud mattered",
    titleAr: "لماذا كانت أُحُد مهمة",
    text: "Uhud taught painful lessons about obedience, discipline, patience, and staying firm after hardship.",
    textAr: "علّمت أُحُد دروسًا مؤلمة في الطاعة والانضباط والصبر والثبات بعد الشدة.",
  },
  {
    id: "c5",
    title: "Why Hudaybiyyah mattered",
    titleAr: "لماذا كان صلح الحديبية مهمًا",
    text: "Hudaybiyyah showed that a treaty that looks difficult in the moment can become a major opening later.",
    textAr: "أظهر صلح الحديبية أن معاهدة قد تبدو صعبة في وقتها يمكن أن تصبح فتحًا كبيرًا لاحقًا.",
  },
  {
    id: "c6",
    title: "Why the Conquest of Makkah mattered",
    titleAr: "لماذا كان فتح مكة مهمًا",
    text: "The conquest showed the Prophet's ﷺ mercy, humility, and forgiveness at the moment of victory.",
    textAr: "أظهر الفتح رحمة النبي ﷺ وتواضعه وعفوه في لحظة الانتصار.",
  },
  {
    id: "c7",
    title: "Why Tabuk mattered",
    titleAr: "لماذا كانت تبوك مهمة",
    text: "Tabuk tested sacrifice, sincerity, and readiness during hardship near the end of the Prophet's ﷺ life.",
    textAr: "اختبرت تبوك التضحية والإخلاص والاستعداد وقت الشدة قرب نهاية حياة النبي ﷺ.",
  },
];

export function BattlesExpeditionsContent({ lang = "en" }: { lang?: CourseLang }) {
  const isRtl = lang === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAll, setShowAll] = useState(false);

  // Major events to show initially (12 most important)
  const majorEventIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 22, 39, 20, 102];

  const filteredEvents = useMemo(() => {
    let events = ALL_EVENTS;

    // Filter by category
    if (selectedCategory !== "All") {
      events = events.filter((event) =>
        event.categoryTags.includes(selectedCategory)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      events = events.filter((event) =>
        isRtl
          ? event.nameAr.toLowerCase().includes(query) ||
            event.typeAr.toLowerCase().includes(query) ||
            event.locationAr.toLowerCase().includes(query) ||
            event.relatedPartiesAr.toLowerCase().includes(query) ||
            event.keyLessonAr.toLowerCase().includes(query) ||
            event.summaryAr.toLowerCase().includes(query)
          : event.name.toLowerCase().includes(query) ||
            event.type.toLowerCase().includes(query) ||
            event.location.toLowerCase().includes(query) ||
            event.relatedParties.toLowerCase().includes(query) ||
            event.keyLesson.toLowerCase().includes(query) ||
            event.summary.toLowerCase().includes(query)
      );
    }

    return events;
  }, [searchQuery, selectedCategory, isRtl]);

  const displayedEvents = showAll
    ? filteredEvents
    : filteredEvents.filter((event) => majorEventIds.includes(event.id));

  const hasMore = filteredEvents.length > majorEventIds.length;
  const isFiltered = searchQuery.trim() || selectedCategory !== "All";

  // Stats
  const majorBattlesCount = ALL_EVENTS.filter((e) =>
    e.categoryTags.includes("Major Battles")
  ).length;
  const ghazwahCount = ALL_EVENTS.filter((e) =>
    e.categoryTags.includes("Ghazwah")
  ).length;
  const sariyyahCount = ALL_EVENTS.filter((e) =>
    e.categoryTags.includes("Sariyyah")
  ).length;
  const totalCount = ALL_EVENTS.length;

  // Get icon for event
  const getEventIcon = (event: Event | typeof TREATY_EVENTS[0]) => {
    if (event.categoryTags.includes("Treaty Events")) return Flag;
    if (event.fightingOccurred === "Yes" || event.fightingOccurred === "Siege")
      return Swords;
    return Shield;
  };

  // Get badge color for importance
  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case "Major":
        return "bg-gold/10 text-gold border-gold/20";
      case "Medium":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-surface-raised text-text-muted border-border/50";
    }
  };

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-ink py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link
          href="/reference"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isRtl ? "العودة إلى مكتبة المراجع" : "Back to Reference Library"}
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
            {isRtl ? "مكتبة المراجع" : "Reference Library"}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            {isRtl ? "الغزوات والسرايا" : "Battles and Expeditions"}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-3xl mb-6">
            {isRtl
              ? "مرجع واضح لأهم المعارك والحملات والغزوات."
              : "A clear reference to the major battles, campaigns, and expeditions of the Prophet ﷺ."}
          </p>

          {/* Educational note */}
          <div className="flex gap-3 p-4 rounded-xl bg-surface border border-border/50">
            <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-text-secondary leading-relaxed">
                {isRtl ? (
                  <>
                    كثيرًا ما تستخدم كتب السيرة مصطلحين:{" "}
                    <span className="font-semibold text-text">الغزوة</span>{" "}
                    و<span className="font-semibold text-text">السرية</span>.
                    الغزوة هي حملة خرج فيها النبي ﷺ بنفسه، سواء وقع فيها قتال
                    أم لا. أما السرية فهي حملة أرسلها النبي ﷺ لكن بقيادة أحد
                    الصحابة. ويختلف العلماء في العدد الدقيق للحملات والغزوات،
                    لذا يركز هذا القسم على أبرز الأحداث المعروفة.
                  </>
                ) : (
                  <>
                    Seerah books often use two terms:{" "}
                    <span className="font-semibold text-text">Ghazwah</span>{" "}
                    and{" "}
                    <span className="font-semibold text-text">Sariyyah</span>.
                    A Ghazwah is an expedition the Prophet ﷺ personally went
                    out on, whether or not fighting occurred. A Sariyyah is an
                    expedition sent by the Prophet ﷺ but led by a companion.
                    Scholars differ on the exact number of campaigns and
                    expeditions, so this section focuses on the major and
                    commonly referenced events.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{majorBattlesCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              {isRtl ? "حملات قتالية كبرى" : "Major fighting campaigns"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{ghazwahCount}+</p>
            <p className="text-xs text-text-secondary mt-1">
              {isRtl ? "حملات مذكورة" : "Campaigns referenced"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{totalCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              {isRtl ? "معارك ودوريات وحملات" : "Battles, patrols, expeditions"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{sariyyahCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              {isRtl ? "سرايا" : "Expeditions (Sariyyah)"}
            </p>
          </div>
        </div>

        {/* Callout cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {CALLOUT_CARDS.map((card) => (
            <div
              key={card.id}
              className="p-4 rounded-xl bg-gold/5 border border-gold/20"
            >
              <h3 className="text-sm font-semibold text-gold mb-2">
                {isRtl ? card.titleAr : card.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {isRtl ? card.textAr : card.text}
              </p>
            </div>
          ))}
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder={
                isRtl
                  ? "ابحث عن المعارك أو الحملات أو الأماكن أو الدروس…"
                  : "Search battles, expeditions, places, or lessons…"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-12 pe-4 py-3 rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTER_CATEGORIES.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-gold/10 border-gold/20 text-gold"
                    : "bg-surface border-border text-text-secondary hover:border-gold/40 hover:text-text"
                }`}
              >
                {isRtl ? CATEGORY_LABELS_AR[category] ?? category : category}
              </button>
            );
          })}
        </div>

        {/* Events grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted">
              {isRtl
                ? "لا توجد أحداث تطابق بحثك أو الفلتر المحدد."
                : "No events match your search or filter."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {displayedEvents.map((event) => {
                const Icon = getEventIcon(event);
                return (
                  <div
                    key={event.id}
                    className="p-5 rounded-xl bg-surface border border-border hover:border-gold/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 flex-shrink-0">
                        <Icon className="w-4 h-4 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-text">
                          {isRtl ? event.nameAr : event.name}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          {isRtl ? event.typeAr : event.type}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="font-medium">
                          {isRtl ? "التاريخ:" : "Date:"}
                        </span>
                        <span>
                          {event.hijriYear}
                          {event.approximateCE && ` / ${event.approximateCE}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="font-medium">
                          {isRtl ? "الموقع:" : "Location:"}
                        </span>
                        <span>{isRtl ? event.locationAr : event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="font-medium">
                          {isRtl ? "الأطراف:" : "Parties:"}
                        </span>
                        <span className="line-clamp-1">
                          {isRtl ? event.relatedPartiesAr : event.relatedParties}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-text-secondary leading-relaxed mb-3">
                      {isRtl ? event.summaryAr : event.summary}
                    </p>

                    <div className="pt-3 border-t border-border space-y-2">
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-1">
                          {isRtl ? "الدرس المستفاد:" : "Key Lesson:"}
                        </p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {isRtl ? event.keyLessonAr : event.keyLesson}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded border text-xs font-medium ${getImportanceBadge(
                            event.importance
                          )}`}
                        >
                          {isRtl
                            ? IMPORTANCE_LABELS_AR[event.importance] ?? event.importance
                            : event.importance}
                        </span>
                        <span
                          className={`px-2 py-1 rounded border text-xs font-medium ${
                            event.fightingOccurred === "Yes" ||
                            event.fightingOccurred === "Siege"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : event.fightingOccurred === "Limited" ||
                                event.fightingOccurred === "Disputed"
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              : "bg-green-500/10 text-green-400 border-green-500/20"
                          }`}
                        >
                          {getFightingLabel(event.fightingOccurred, isRtl)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show more/less button */}
            {hasMore && !isFiltered && (
              <div className="text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-6 py-3 rounded-xl bg-surface border border-border text-sm font-semibold text-text hover:border-gold/40 hover:bg-surface-raised transition-colors"
                >
                  {showAll
                    ? isRtl
                      ? "عرض أقل"
                      : "Show Less"
                    : isRtl
                    ? `عرض جميع الأحداث (${filteredEvents.length})`
                    : `View All ${filteredEvents.length} Events`}
                </button>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="p-6 rounded-2xl bg-surface border border-border text-center">
            <h2 className="text-lg font-semibold text-text mb-2">
              {isRtl ? "واصل تعلم السيرة النبوية" : "Continue Learning the Seerah"}
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {isRtl
                ? "عد إلى دورة السيرة الكاملة لدراسة السياق والدروس وتفاصيل هذه الأحداث."
                : "Go back to the full Seerah course to study the context, lessons, and details of these events."}
            </p>
            <Link
              href="/seerah"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-ink font-semibold hover:bg-gold-light transition-colors"
            >
              {isRtl ? "اذهب إلى دورة السيرة" : "Go to Seerah Course"}
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/reference"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isRtl ? "العودة إلى مكتبة المراجع" : "Back to Reference Library"}
          </Link>
        </div>
      </div>
    </main>
  );
}
