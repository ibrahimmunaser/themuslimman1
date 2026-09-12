"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, MapPin, Info } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";

interface Place {
  name: string;
  nameAr: string;
  nameFr: string;
  type: string;
  typeAr: string;
  typeFr: string;
  region?: string;
  regionAr?: string;
  regionFr?: string;
  area?: string;
  areaAr?: string;
  areaFr?: string;
  connection: string;
  connectionAr: string;
  connectionFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  category: string;
  relatedEvent?: string;
  relatedEventAr?: string;
  relatedEventFr?: string;
}

interface Route {
  name: string;
  nameAr: string;
  nameFr: string;
  path: string;
  pathAr: string;
  pathFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
}

// ── Places Data ────────────────────────────────────────────────────────────────

const MAJOR_CITIES: Place[] = [
  { name: "Makkah", nameAr: "مكة المكرمة", nameFr: "La Mecque", type: "City", typeAr: "مدينة", typeFr: "Ville", region: "Hijaz", regionAr: "الحجاز", regionFr: "Hedjaz", connection: "Birthplace of the Prophet ﷺ and start of the early mission", connectionAr: "مسقط رأس النبي ﷺ وبداية الدعوة الأولى", connectionFr: "Lieu de naissance du Prophète ﷺ et début de la mission première", description: "Makkah was the city where the Prophet ﷺ was born, where the early call to Islam began, and where Quraysh held power around the Ka'bah.", descriptionAr: "مكة هي المدينة التي وُلد فيها النبي ﷺ، وحيث بدأت الدعوة إلى الإسلام، وحيث كانت قريش تملك السلطة حول الكعبة.", descriptionFr: "La Mecque était la ville où le Prophète ﷺ est né, où a commencé l'appel précoce à l'islam, et où Quraysh détenait le pouvoir autour de la Kaaba.", category: "Makkah" },
  { name: "Madinah", nameAr: "المدينة المنورة", nameFr: "Médine", type: "City", typeAr: "مدينة", typeFr: "Ville", region: "Hijaz", regionAr: "الحجاز", regionFr: "Hedjaz", connection: "Hijrah and Islamic state", connectionAr: "الهجرة والدولة الإسلامية", connectionFr: "Hégire et État islamique", description: "Madinah, formerly known as Yathrib, became the home of the Muslims after the Hijrah and the center of the growing Muslim community.", descriptionAr: "المدينة المنورة، المعروفة سابقًا بيثرب، أصبحت موطن المسلمين بعد الهجرة ومركز المجتمع المسلم المتنامي.", descriptionFr: "Médine, anciennement connue sous le nom de Yathrib, est devenue le foyer des musulmans après l'Hégire et le centre de la communauté musulmane naissante.", category: "Madinah" },
  { name: "Ta'if", nameAr: "الطائف", nameFr: "Ta'if", type: "City", typeAr: "مدينة", typeFr: "Ville", region: "Near Makkah", regionAr: "قرب مكة", regionFr: "Près de La Mecque", connection: "Visit of da'wah and later Islam", connectionAr: "رحلة الدعوة ثم دخولها الإسلام لاحقًا", connectionFr: "Visite de da'wah puis entrée dans l'islam plus tard", description: "The Prophet ﷺ traveled to Ta'if seeking support after the Year of Sorrow and was rejected there, though the city later entered Islam.", descriptionAr: "سافر النبي ﷺ إلى الطائف طلبًا للنصرة بعد عام الحزن، فقوبل بالرفض هناك، وإن كانت المدينة قد دخلت الإسلام لاحقًا.", descriptionFr: "Le Prophète ﷺ s'est rendu à Ta'if pour chercher un soutien après l'Année de la Tristesse et y a été rejeté, bien que la ville soit entrée dans l'islam plus tard.", category: "Arabia" },
  { name: "Khaybar", nameAr: "خيبر", nameFr: "Khaybar", type: "Settlement / Oasis region", typeAr: "مستوطنة / منطقة واحة", typeFr: "Établissement / région d'oasis", region: "North of Madinah", regionAr: "شمال المدينة", regionFr: "Au nord de Médine", connection: "Major Madinan campaign", connectionAr: "غزوة مدنية كبرى", connectionFr: "Campagne médinoise majeure", description: "Khaybar was a fortified region north of Madinah and the site of a major campaign in the Madinan period.", descriptionAr: "كانت خيبر منطقة محصّنة شمال المدينة، وموقع غزوة كبرى في العهد المدني.", descriptionFr: "Khaybar était une région fortifiée au nord de Médine et le site d'une campagne majeure de la période médinoise.", category: "Arabia" },
  { name: "Tabuk", nameAr: "تبوك", nameFr: "Tabuk", type: "Region / expedition destination", typeAr: "منطقة / وجهة غزوة", typeFr: "Région / destination d'expédition", region: "North Arabia", regionAr: "شمال الجزيرة العربية", regionFr: "Arabie du Nord", connection: "Expedition of Tabuk", connectionAr: "غزوة تبوك", connectionFr: "Expédition de Tabuk", description: "Tabuk marks the destination of one of the last major expeditions in the Prophet's ﷺ life.", descriptionAr: "تبوك هي وجهة إحدى آخر الغزوات الكبرى في حياة النبي ﷺ.", descriptionFr: "Tabuk marque la destination de l'une des dernières grandes expéditions de la vie du Prophète ﷺ.", category: "Arabia" },
  { name: "Abyssinia", nameAr: "الحبشة", nameFr: "Abyssinie", type: "Kingdom / region", typeAr: "مملكة / منطقة", typeFr: "Royaume / région", region: "Across the Red Sea", regionAr: "عبر البحر الأحمر", regionFr: "De l'autre côté de la mer Rouge", connection: "Early migration", connectionAr: "الهجرة المبكرة", connectionFr: "Migration précoce", description: "Abyssinia was the land to which some early Muslims migrated to escape persecution in Makkah.", descriptionAr: "كانت الحبشة الأرض التي هاجر إليها بعض المسلمين الأوائل هربًا من الاضطهاد في مكة.", descriptionFr: "L'Abyssinie était le pays vers lequel certains premiers musulmans ont émigré pour échapper à la persécution à La Mecque.", category: "Outside Arabia" },
  { name: "Mu'tah", nameAr: "مؤتة", nameFr: "Mu'tah", type: "Location", typeAr: "موقع", typeFr: "Lieu", region: "Greater Syria area", regionAr: "منطقة بلاد الشام", regionFr: "Région de la Grande Syrie", connection: "Battle of Mu'tah", connectionAr: "غزوة مؤتة", connectionFr: "Bataille de Mu'tah", description: "Mu'tah was the site of a major battle involving the Muslims beyond Arabia.", descriptionAr: "مؤتة هي موقع معركة كبرى خاضها المسلمون خارج الجزيرة العربية.", descriptionFr: "Mu'tah fut le site d'une bataille majeure impliquant les musulmans hors d'Arabie.", category: "Outside Arabia" },
];

const MAKKAH_MADINAH_LOCATIONS: Place[] = [
  { name: "Ka'bah", nameAr: "الكعبة", nameFr: "Kaaba", type: "Sacred site", typeAr: "موقع مقدس", typeFr: "Site sacré", area: "Makkah", areaAr: "مكة", areaFr: "La Mecque", connection: "Center of worship", connectionAr: "مركز العبادة", connectionFr: "Centre du culte", description: "The Ka'bah was the focal point of worship and central to the religious significance of Makkah.", descriptionAr: "كانت الكعبة محور العبادة والمكانة الدينية المركزية لمكة.", descriptionFr: "La Kaaba était le point focal du culte et au cœur de la signification religieuse de La Mecque.", category: "Makkah" },
  { name: "Cave of Hira", nameAr: "غار حراء", nameFr: "Grotte de Hira", type: "Cave / mountain location", typeAr: "كهف / موقع جبلي", typeFr: "Grotte / site de montagne", area: "Near Makkah", areaAr: "قرب مكة", areaFr: "Près de La Mecque", connection: "First revelation", connectionAr: "نزول الوحي الأول", connectionFr: "Première révélation", description: "The first revelation came to the Prophet ﷺ in the Cave of Hira on Jabal al-Nur.", descriptionAr: "نزل الوحي الأول على النبي ﷺ في غار حراء في جبل النور.", descriptionFr: "La première révélation vint au Prophète ﷺ dans la grotte de Hira sur Jabal al-Nur.", category: "Makkah" },
  { name: "Cave of Thawr", nameAr: "غار ثور", nameFr: "Grotte de Thawr", type: "Cave / mountain location", typeAr: "كهف / موقع جبلي", typeFr: "Grotte / site de montagne", area: "Near Makkah", areaAr: "قرب مكة", areaFr: "Près de La Mecque", connection: "Hijrah", connectionAr: "الهجرة", connectionFr: "Hégire", description: "The Prophet ﷺ and Abu Bakr رضي الله عنه sheltered in the Cave of Thawr during the Hijrah.", descriptionAr: "احتمى النبي ﷺ وأبو بكر رضي الله عنه في غار ثور أثناء الهجرة.", descriptionFr: "Le Prophète ﷺ et Abu Bakr رضي الله عنه se sont abrités dans la grotte de Thawr pendant l'Hégire.", category: "Hijrah Route" },
  { name: "Mina", nameAr: "منى", nameFr: "Mina", type: "Valley", typeAr: "وادٍ", typeFr: "Vallée", area: "Near Makkah", areaAr: "قرب مكة", areaFr: "Près de La Mecque", connection: "Hajj and pledges", connectionAr: "الحج والبيعات", connectionFr: "Hajj et serments d'allégeance", description: "Mina is connected to the rites of Hajj and to the pledges that helped prepare the way for the Hijrah.", descriptionAr: "ترتبط منى بمناسك الحج وبالبيعات التي مهّدت الطريق للهجرة.", descriptionFr: "Mina est liée aux rites du Hajj et aux serments qui ont préparé la voie de l'Hégire.", category: "Hajj Locations" },
  { name: "Arafah", nameAr: "عرفة", nameFr: "Arafat", type: "Plain / sacred site", typeAr: "سهل / موقع مقدس", typeFr: "Plaine / site sacré", area: "Near Makkah", areaAr: "قرب مكة", areaFr: "Près de La Mecque", connection: "Hajj", connectionAr: "الحج", connectionFr: "Hajj", description: "Arafah is one of the most important sites of Hajj and is associated with the Farewell Pilgrimage.", descriptionAr: "عرفة من أهم مواقع الحج، وترتبط بحجة الوداع.", descriptionFr: "Arafat est l'un des sites les plus importants du Hajj et est associé au Pèlerinage d'Adieu.", category: "Hajj Locations" },
  { name: "Muzdalifah", nameAr: "مزدلفة", nameFr: "Muzdalifah", type: "Open plain", typeAr: "سهل مفتوح", typeFr: "Plaine ouverte", area: "Near Makkah", areaAr: "قرب مكة", areaFr: "Près de La Mecque", connection: "Hajj", connectionAr: "الحج", connectionFr: "Hajj", description: "Muzdalifah is one of the key locations connected to the rites of Hajj.", descriptionAr: "مزدلفة من أهم المواقع المرتبطة بمناسك الحج.", descriptionFr: "Muzdalifah est l'un des lieux clés liés aux rites du Hajj.", category: "Hajj Locations" },
  { name: "Quba", nameAr: "قباء", nameFr: "Quba", type: "Area / mosque location", typeAr: "منطقة / موقع مسجد", typeFr: "Quartier / site de mosquée", area: "Near Madinah", areaAr: "قرب المدينة", areaFr: "Près de Médine", connection: "Arrival after Hijrah", connectionAr: "الوصول بعد الهجرة", connectionFr: "Arrivée après l'Hégire", description: "Quba was the first stopping place of the Prophet ﷺ upon arriving near Madinah and the site of Quba Mosque.", descriptionAr: "كانت قباء أول محطة توقف فيها النبي ﷺ عند اقترابه من المدينة، وموقع مسجد قباء.", descriptionFr: "Quba fut le premier arrêt du Prophète ﷺ à son approche de Médine et le site de la mosquée de Quba.", category: "Madinah" },
  { name: "Masjid al-Nabawi", nameAr: "المسجد النبوي", nameFr: "Mosquée du Prophète", type: "Mosque", typeAr: "مسجد", typeFr: "Mosquée", area: "Madinah", areaAr: "المدينة", areaFr: "Médine", connection: "Center of community", connectionAr: "مركز المجتمع", connectionFr: "Centre de la communauté", description: "Masjid al-Nabawi became the center of worship, leadership, teaching, and community life in Madinah.", descriptionAr: "أصبح المسجد النبوي مركز العبادة والقيادة والتعليم والحياة المجتمعية في المدينة.", descriptionFr: "La Mosquée du Prophète est devenue le centre du culte, du leadership, de l'enseignement et de la vie communautaire à Médine.", category: "Madinah" },
  { name: "Jannat al-Baqi'", nameAr: "البقيع", nameFr: "Jannat al-Baqi'", type: "Cemetery", typeAr: "مقبرة", typeFr: "Cimetière", area: "Madinah", areaAr: "المدينة", areaFr: "Médine", connection: "Burial ground", connectionAr: "مقبرة", connectionFr: "Lieu de sépulture", description: "Al-Baqi' became the well-known burial place for many companions and family members.", descriptionAr: "أصبح البقيع المقبرة المعروفة للعديد من الصحابة وأفراد الأسرة.", descriptionFr: "Al-Baqi' est devenu le lieu de sépulture bien connu de nombreux compagnons et membres de la famille.", category: "Madinah" },
  { name: "Masjid al-Qiblatayn", nameAr: "مسجد القبلتين", nameFr: "Mosquée des Deux Qiblas", type: "Mosque", typeAr: "مسجد", typeFr: "Mosquée", area: "Madinah", areaAr: "المدينة", areaFr: "Médine", connection: "Qiblah change", connectionAr: "تحويل القبلة", connectionFr: "Changement de qibla", description: "This location is associated with the change of the qiblah from Jerusalem to the Ka'bah.", descriptionAr: "يرتبط هذا الموقع بتحويل القبلة من بيت المقدس إلى الكعبة.", descriptionFr: "Ce lieu est associé au changement de la qibla de Jérusalem vers la Kaaba.", category: "Madinah" },
  { name: "Mount Uhud", nameAr: "جبل أُحُد", nameFr: "Mont Uhud", type: "Mountain", typeAr: "جبل", typeFr: "Montagne", area: "Madinah", areaAr: "المدينة", areaFr: "Médine", connection: "Battle of Uhud", connectionAr: "غزوة أُحُد", connectionFr: "Bataille de Uhud", description: "Mount Uhud is the site of the famous battle and one of the most important locations in the Madinan Seerah.", descriptionAr: "جبل أُحُد هو موقع الغزوة الشهيرة وأحد أهم المواقع في السيرة المدنية.", descriptionFr: "Le mont Uhud est le site de la célèbre bataille et l'un des lieux les plus importants de la Sîra médinoise.", category: "Battles" },
  { name: "Trench / Khandaq area", nameAr: "منطقة الخندق", nameFr: "Zone du Fossé / Khandaq", type: "Battlefield zone", typeAr: "منطقة معركة", typeFr: "Zone de champ de bataille", area: "Madinah", areaAr: "المدينة", areaFr: "Médine", connection: "Battle of the Trench", connectionAr: "غزوة الخندق", connectionFr: "Bataille du Fossé", description: "This area marks where the Muslims dug the trench to defend Madinah from the confederate siege.", descriptionAr: "تحدد هذه المنطقة الموضع الذي حفر فيه المسلمون الخندق للدفاع عن المدينة من حصار الأحزاب.", descriptionFr: "Cette zone marque l'endroit où les musulmans ont creusé le fossé pour défendre Médine contre le siège des confédérés.", category: "Battles" },
];

const BATTLES_EXPEDITIONS: Place[] = [
  { name: "Badr", nameAr: "بدر", nameFr: "Badr", type: "Battlefield / well area", typeAr: "ساحة معركة / منطقة بئر", typeFr: "Champ de bataille / zone de puits", connection: "Battle of Badr", connectionAr: "غزوة بدر", connectionFr: "Bataille de Badr", description: "Badr was the site of the first major battle between the Muslims and Quraysh.", descriptionAr: "بدر هي موقع أول معركة كبرى بين المسلمين وقريش.", descriptionFr: "Badr fut le site de la première bataille majeure entre les musulmans et Quraysh.", category: "Battles", relatedEvent: "Battle of Badr", relatedEventAr: "غزوة بدر", relatedEventFr: "Bataille de Badr" },
  { name: "Uhud", nameAr: "أُحُد", nameFr: "Uhud", type: "Battlefield", typeAr: "ساحة معركة", typeFr: "Champ de bataille", connection: "Battle of Uhud", connectionAr: "غزوة أُحُد", connectionFr: "Bataille de Uhud", description: "Uhud was the site of a major battle that taught lasting lessons about obedience and discipline.", descriptionAr: "أُحُد هي موقع معركة كبرى علّمت دروسًا خالدة في الطاعة والانضباط.", descriptionFr: "Uhud fut le site d'une bataille majeure qui a enseigné des leçons durables sur l'obéissance et la discipline.", category: "Battles", relatedEvent: "Battle of Uhud", relatedEventAr: "غزوة أُحُد", relatedEventFr: "Bataille de Uhud" },
  { name: "Khandaq", nameAr: "الخندق", nameFr: "Khandaq", type: "Battlefield / defensive zone", typeAr: "ساحة معركة / منطقة دفاعية", typeFr: "Champ de bataille / zone défensive", connection: "Battle of the Trench", connectionAr: "غزوة الخندق", connectionFr: "Bataille du Fossé", description: "The confederate forces were held off through the trench strategy around Madinah.", descriptionAr: "صُدّت قوات الأحزاب من خلال استراتيجية حفر الخندق حول المدينة.", descriptionFr: "Les forces confédérées furent contenues grâce à la stratégie du fossé autour de Médine.", category: "Battles", relatedEvent: "Battle of the Trench", relatedEventAr: "غزوة الخندق", relatedEventFr: "Bataille du Fossé" },
  { name: "Hudaybiyyah", nameAr: "الحديبية", nameFr: "Hudaybiyyah", type: "Outskirts / treaty site", typeAr: "ضواحٍ / موقع معاهدة", typeFr: "Périphérie / site de traité", connection: "Treaty of Hudaybiyyah", connectionAr: "صلح الحديبية", connectionFr: "Traité de Hudaybiyyah", description: "Hudaybiyyah was the place where the treaty was concluded between the Muslims and Quraysh.", descriptionAr: "الحديبية هي المكان الذي أُبرم فيه الصلح بين المسلمين وقريش.", descriptionFr: "Hudaybiyyah fut le lieu où le traité fut conclu entre les musulmans et Quraysh.", category: "Routes", relatedEvent: "Treaty of Hudaybiyyah", relatedEventAr: "صلح الحديبية", relatedEventFr: "Traité de Hudaybiyyah" },
  { name: "Hunayn", nameAr: "حُنين", nameFr: "Hunayn", type: "Valley", typeAr: "وادٍ", typeFr: "Vallée", connection: "Battle of Hunayn", connectionAr: "غزوة حنين", connectionFr: "Bataille de Hunayn", description: "Hunayn was the site of the battle that followed the conquest of Makkah.", descriptionAr: "حنين هي موقع الغزوة التي تلت فتح مكة.", descriptionFr: "Hunayn fut le site de la bataille qui suivit la conquête de La Mecque.", category: "Battles", relatedEvent: "Battle of Hunayn", relatedEventAr: "غزوة حنين", relatedEventFr: "Bataille de Hunayn" },
  { name: "Ta'if campaign area", nameAr: "منطقة حملة الطائف", nameFr: "Zone de la campagne de Ta'if", type: "City / siege area", typeAr: "مدينة / منطقة حصار", typeFr: "Ville / zone de siège", connection: "After Hunayn", connectionAr: "بعد حنين", connectionFr: "Après Hunayn", description: "The Muslims moved toward Ta'if after Hunayn.", descriptionAr: "توجّه المسلمون نحو الطائف بعد حنين.", descriptionFr: "Les musulmans se dirigèrent vers Ta'if après Hunayn.", category: "Routes", relatedEvent: "Siege of Ta'if", relatedEventAr: "حصار الطائف", relatedEventFr: "Siège de Ta'if" },
  { name: "Khaybar", nameAr: "خيبر", nameFr: "Khaybar", type: "Fortified oasis area", typeAr: "منطقة واحة محصّنة", typeFr: "Zone d'oasis fortifiée", connection: "Khaybar campaign", connectionAr: "غزوة خيبر", connectionFr: "Campagne de Khaybar", description: "Khaybar was a significant northern campaign in the Madinan period.", descriptionAr: "كانت خيبر غزوة شمالية بارزة في العهد المدني.", descriptionFr: "Khaybar fut une campagne septentrionale importante de la période médinoise.", category: "Battles", relatedEvent: "Khaybar campaign", relatedEventAr: "غزوة خيبر", relatedEventFr: "Campagne de Khaybar" },
  { name: "Mu'tah", nameAr: "مؤتة", nameFr: "Mu'tah", type: "Battle location", typeAr: "موقع معركة", typeFr: "Lieu de bataille", connection: "Battle of Mu'tah", connectionAr: "غزوة مؤتة", connectionFr: "Bataille de Mu'tah", description: "Mu'tah was the site of a major expedition facing Byzantine-allied forces.", descriptionAr: "مؤتة هي موقع غزوة كبرى واجه فيها المسلمون قوات موالية للروم.", descriptionFr: "Mu'tah fut le site d'une grande expédition face à des forces alliées aux Byzantins.", category: "Battles", relatedEvent: "Battle of Mu'tah", relatedEventAr: "غزوة مؤتة", relatedEventFr: "Bataille de Mu'tah" },
  { name: "Tabuk", nameAr: "تبوك", nameFr: "Tabuk", type: "Expedition destination", typeAr: "وجهة غزوة", typeFr: "Destination d'expédition", connection: "Expedition of Tabuk", connectionAr: "غزوة تبوك", connectionFr: "Expédition de Tabuk", description: "Tabuk was one of the last major expedition destinations during the Prophet's ﷺ life.", descriptionAr: "كانت تبوك إحدى آخر وجهات الغزوات الكبرى في حياة النبي ﷺ.", descriptionFr: "Tabuk fut l'une des dernières grandes destinations d'expédition de la vie du Prophète ﷺ.", category: "Routes", relatedEvent: "Expedition of Tabuk", relatedEventAr: "غزوة تبوك", relatedEventFr: "Expédition de Tabuk" },
  { name: "Ji'ranah", nameAr: "الجعرانة", nameFr: "Ji'ranah", type: "Location", typeAr: "موقع", typeFr: "Lieu", connection: "Return from Hunayn", connectionAr: "العودة من حنين", connectionFr: "Retour de Hunayn", description: "Ji'ranah is associated with events after Hunayn.", descriptionAr: "ترتبط الجعرانة بالأحداث التي تلت غزوة حنين.", descriptionFr: "Ji'ranah est associée aux événements qui suivirent Hunayn.", category: "Routes", relatedEvent: "After Hunayn", relatedEventAr: "بعد حنين", relatedEventFr: "Après Hunayn" },
];

const ROUTES: Route[] = [
  { name: "Makkan Da'wah Zone", nameAr: "منطقة الدعوة المكية", nameFr: "Zone de da'wah mecquoise", path: "Makkah → Cave of Hira → surrounding Quraysh environment", pathAr: "مكة → غار حراء → محيط قريش المجاور", pathFr: "La Mecque → Grotte de Hira → environnement voisin de Quraysh", description: "The early phase of the mission centered around Makkah and its vicinity.", descriptionAr: "تمركزت المرحلة الأولى من الدعوة حول مكة وما جاورها.", descriptionFr: "La phase précoce de la mission était centrée autour de La Mecque et de ses environs." },
  { name: "Hijrah Route", nameAr: "طريق الهجرة", nameFr: "Route de l'Hégire", path: "Makkah → Cave of Thawr → route northward → Quba → Madinah", pathAr: "مكة → غار ثور → الطريق شمالًا → قباء → المدينة", pathFr: "La Mecque → Grotte de Thawr → route vers le nord → Quba → Médine", description: "The migration route that marked the turning point for the Muslim community.", descriptionAr: "طريق الهجرة الذي شكّل نقطة التحول للمجتمع المسلم.", descriptionFr: "La route de migration qui marqua le tournant pour la communauté musulmane." },
  { name: "Ta'if Journey", nameAr: "رحلة الطائف", nameFr: "Voyage à Ta'if", path: "Makkah → Ta'if → return to Makkah", pathAr: "مكة → الطائف → العودة إلى مكة", pathFr: "La Mecque → Ta'if → retour à La Mecque", description: "The Prophet's ﷺ journey seeking support after the Year of Sorrow.", descriptionAr: "رحلة النبي ﷺ طلبًا للنصرة بعد عام الحزن.", descriptionFr: "Le voyage du Prophète ﷺ en quête de soutien après l'Année de la Tristesse." },
  { name: "Badr Route", nameAr: "طريق بدر", nameFr: "Route de Badr", path: "Madinah → Badr", pathAr: "المدينة → بدر", pathFr: "Médine → Badr", description: "The route to the first major battle.", descriptionAr: "الطريق إلى أول معركة كبرى.", descriptionFr: "La route vers la première bataille majeure." },
  { name: "Hudaybiyyah Route", nameAr: "طريق الحديبية", nameFr: "Route de Hudaybiyyah", path: "Madinah → outskirts of Makkah → Hudaybiyyah", pathAr: "المدينة → ضواحي مكة → الحديبية", pathFr: "Médine → périphérie de La Mecque → Hudaybiyyah", description: "The journey that led to the treaty between Muslims and Quraysh.", descriptionAr: "الرحلة التي أفضت إلى الصلح بين المسلمين وقريش.", descriptionFr: "Le voyage qui mena au traité entre les musulmans et Quraysh." },
  { name: "Khaybar Route", nameAr: "طريق خيبر", nameFr: "Route de Khaybar", path: "Madinah → Khaybar", pathAr: "المدينة → خيبر", pathFr: "Médine → Khaybar", description: "The northern campaign route from Madinah.", descriptionAr: "طريق الغزوة الشمالية انطلاقًا من المدينة.", descriptionFr: "La route de la campagne septentrionale depuis Médine." },
  { name: "Tabuk Route", nameAr: "طريق تبوك", nameFr: "Route de Tabuk", path: "Madinah → Tabuk", pathAr: "المدينة → تبوك", pathFr: "Médine → Tabuk", description: "One of the longest expeditions during the Prophet's ﷺ life.", descriptionAr: "إحدى أطول الغزوات في حياة النبي ﷺ.", descriptionFr: "L'une des plus longues expéditions de la vie du Prophète ﷺ." },
  { name: "Abyssinia Migration", nameAr: "هجرة الحبشة", nameFr: "Migration vers l'Abyssinie", path: "Makkah → Red Sea crossing → Abyssinia", pathAr: "مكة → عبور البحر الأحمر → الحبشة", pathFr: "La Mecque → traversée de la mer Rouge → Abyssinie", description: "The migration route for early Muslims escaping persecution.", descriptionAr: "طريق هجرة المسلمين الأوائل هربًا من الاضطهاد.", descriptionFr: "La route de migration des premiers musulmans fuyant la persécution." },
];

const FILTER_CATEGORIES = [
  "All",
  "Makkah",
  "Madinah",
  "Battles",
  "Hijrah Route",
  "Hajj Locations",
  "Routes",
  "Arabia",
  "Outside Arabia",
];

const CATEGORY_LABELS_AR: Record<string, string> = {
  "All": "الكل",
  "Makkah": "مكة",
  "Madinah": "المدينة",
  "Battles": "المعارك",
  "Hijrah Route": "طريق الهجرة",
  "Hajj Locations": "مواقع الحج",
  "Routes": "الطرق",
  "Arabia": "الجزيرة العربية",
  "Outside Arabia": "خارج الجزيرة العربية",
};

const CATEGORY_LABELS_FR: Record<string, string> = {
  "All": "Tous",
  "Makkah": "La Mecque",
  "Madinah": "Médine",
  "Battles": "Batailles",
  "Hijrah Route": "Route de l'Hégire",
  "Hajj Locations": "Lieux du Hajj",
  "Routes": "Routes",
  "Arabia": "Arabie",
  "Outside Arabia": "Hors d'Arabie",
};

function categoryLabel(lang: CourseLang, category: string): string {
  return loc(lang, category, CATEGORY_LABELS_AR[category] || category, CATEGORY_LABELS_FR[category] || category);
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PlacesMapsContent({ lang = "en" }: { lang?: CourseLang }) {
  const isRtl = lang === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAllPlaces, setShowAllPlaces] = useState(false);

  const allPlaces = [...MAJOR_CITIES, ...MAKKAH_MADINAH_LOCATIONS, ...BATTLES_EXPEDITIONS];

  const filteredPlaces = useMemo(() => {
    let results = allPlaces;

    // Filter by category
    if (selectedCategory !== "All") {
      results = results.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter((p) => {
        if (lang === "ar") {
          return (
            p.nameAr.includes(searchQuery) ||
            p.typeAr.includes(searchQuery) ||
            p.connectionAr.includes(searchQuery) ||
            p.descriptionAr.includes(searchQuery) ||
            (p.relatedEventAr && p.relatedEventAr.includes(searchQuery))
          );
        }
        if (lang === "fr") {
          return (
            p.nameFr.toLowerCase().includes(query) ||
            p.typeFr.toLowerCase().includes(query) ||
            p.connectionFr.toLowerCase().includes(query) ||
            p.descriptionFr.toLowerCase().includes(query) ||
            (p.relatedEventFr && p.relatedEventFr.toLowerCase().includes(query))
          );
        }
        return (
          p.name.toLowerCase().includes(query) ||
          p.type.toLowerCase().includes(query) ||
          p.connection.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (p.relatedEvent && p.relatedEvent.toLowerCase().includes(query))
        );
      });
    }

    return results;
  }, [searchQuery, selectedCategory, allPlaces, lang]);

  const displayedPlaces = showAllPlaces ? filteredPlaces : filteredPlaces.slice(0, 12);

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-ink py-16">
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
            {loc(lang, "Places and Maps", "الأماكن والخرائط", "Lieux et cartes")}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            {loc(
              lang,
              "A reference to the key cities, routes, and locations mentioned in the Seerah.",
              "مرجع لأهم المدن والطرق والمواقع المذكورة في السيرة.",
              "Un référentiel des principales villes, routes et lieux mentionnés dans la Sîra.",
            )}
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {loc(
              lang,
              "The Seerah happened across real cities, valleys, mountains, battlefields, and travel routes. Understanding the places of the Seerah helps users follow the story more clearly and see how migration, trade, battle, da'wah, and worship all unfolded across Arabia and beyond.",
              "وقعت أحداث السيرة في مدن ووديان وجبال وساحات معارك وطرق سفر حقيقية. فهم أماكن السيرة يساعد المستخدمين على متابعة القصة بوضوح أكبر ورؤية كيف تشابكت الهجرة والتجارة والقتال والدعوة والعبادة عبر الجزيرة العربية وخارجها.",
              "La Sîra s'est déroulée dans de véritables villes, vallées, montagnes, champs de bataille et routes de voyage. Comprendre les lieux de la Sîra aide à suivre l'histoire plus clairement et à voir comment la migration, le commerce, le combat, la da'wah et le culte se sont entremêlés à travers l'Arabie et au-delà.",
            )}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: loc(lang, "Key places", "أماكن رئيسية", "Lieux clés"), value: `${allPlaces.length}+` },
            { label: loc(lang, "Major routes", "طرق رئيسية", "Routes principales"), value: `${ROUTES.length}` },
            { label: loc(lang, "Cities", "مدن", "Villes"), value: `${MAJOR_CITIES.length}` },
            { label: loc(lang, "Battle sites", "مواقع المعارك", "Sites de batailles"), value: `${BATTLES_EXPEDITIONS.filter(p => p.category === "Battles").length}` },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-xl border border-border bg-surface text-center">
              <p className="text-xl font-bold text-gold">{stat.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Callout Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {[
            {
              title: loc(lang, "Why place matters in the Seerah", "لماذا تهم الأماكن في السيرة", "Pourquoi les lieux comptent dans la Sîra"),
              text: loc(
                lang,
                "The Seerah is easier to follow when users can locate where revelation, persecution, migration, battles, treaties, and worship took place.",
                "تصبح السيرة أسهل متابعةً عندما يستطيع المستخدمون تحديد أماكن نزول الوحي، والاضطهاد، والهجرة، والمعارك، والمعاهدات، والعبادة.",
                "La Sîra est plus facile à suivre lorsque l'on peut situer où la révélation, la persécution, la migration, les batailles, les traités et le culte ont eu lieu.",
              ),
            },
            {
              title: loc(lang, "Why Makkah matters", "لماذا تهم مكة", "Pourquoi La Mecque compte"),
              text: loc(
                lang,
                "Makkah is the birthplace of the Prophet ﷺ, the site of the Ka'bah, and the place where the mission began under Quraysh opposition.",
                "مكة هي مسقط رأس النبي ﷺ، وموقع الكعبة، والمكان الذي بدأت فيه الدعوة تحت معارضة قريش.",
                "La Mecque est le lieu de naissance du Prophète ﷺ, le site de la Kaaba, et l'endroit où la mission a commencé sous l'opposition de Quraysh.",
              ),
            },
            {
              title: loc(lang, "Why Madinah matters", "لماذا تهم المدينة", "Pourquoi Médine compte"),
              text: loc(
                lang,
                "Madinah is where the Muslims built a community, established social order, and moved from persecution to strength after the Hijrah.",
                "المدينة هي المكان الذي بنى فيه المسلمون مجتمعهم، وأسّسوا النظام الاجتماعي، وانتقلوا من الاضطهاد إلى القوة بعد الهجرة.",
                "Médine est l'endroit où les musulmans ont bâti une communauté, établi un ordre social, et sont passés de la persécution à la force après l'Hégire.",
              ),
            },
          ].map((card) => (
            <div key={card.title} className="p-4 rounded-xl border border-border bg-surface">
              <h3 className="text-sm font-bold text-gold mb-2">{card.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{card.text}</p>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="relative mb-4">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder={loc(lang, "Search places, cities, or locations…", "ابحث عن الأماكن أو المدن أو المواقع…", "Rechercher des lieux, villes ou sites…")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-11 pe-4 py-3 rounded-xl border border-border bg-surface text-text placeholder-text-muted focus:outline-none focus:border-gold/40 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTER_CATEGORIES.map((category) => {
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

        {/* Places Grid */}
        {filteredPlaces.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-secondary">
              {loc(lang, "No places found matching your search.", "لا توجد أماكن مطابقة لبحثك.", "Aucun lieu ne correspond à votre recherche.")}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 text-sm text-text-muted">
              <MapPin className="w-4 h-4" />
              <span>
                {loc(
                  lang,
                  `Showing ${displayedPlaces.length} of ${filteredPlaces.length} places`,
                  `عرض ${displayedPlaces.length} من ${filteredPlaces.length} مكانًا`,
                  `Affichage de ${displayedPlaces.length} sur ${filteredPlaces.length} lieux`,
                )}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {displayedPlaces.map((place, index) => (
                <PlaceCard key={index} place={place} lang={lang} />
              ))}
            </div>

            {/* Show more/less */}
            {filteredPlaces.length > 12 && (
              <div className="text-center mb-12">
                <button
                  onClick={() => setShowAllPlaces(!showAllPlaces)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface border border-border hover:border-gold/40 text-text-secondary hover:text-text font-medium text-sm transition-colors"
                >
                  {showAllPlaces
                    ? loc(lang, "Show Less", "عرض أقل", "Afficher moins")
                    : loc(
                        lang,
                        `Show All ${filteredPlaces.length} Places`,
                        `عرض جميع الأماكن (${filteredPlaces.length})`,
                        `Afficher les ${filteredPlaces.length} lieux`,
                      )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Routes Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text mb-4">{loc(lang, "Major Routes", "الطرق الرئيسية", "Routes principales")}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {ROUTES.map((route, index) => (
              <div key={index} className="p-4 rounded-xl border border-border bg-surface">
                <h3 className="text-base font-bold text-gold mb-2">{loc(lang, route.name, route.nameAr, route.nameFr)}</h3>
                <p className="text-xs text-text-muted mb-3 font-mono">{loc(lang, route.path, route.pathAr, route.pathFr)}</p>
                <p className="text-xs text-text-secondary leading-relaxed">{loc(lang, route.description, route.descriptionAr, route.descriptionFr)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Map Placeholder */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text mb-4">{loc(lang, "Interactive Reference Map", "خريطة مرجعية تفاعلية", "Carte de référence interactive")}</h2>
          <div className="rounded-2xl border-2 border-border bg-surface p-8 text-center">
            <div className="max-w-md mx-auto">
              <MapPin className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-lg font-bold text-text mb-2">
                {loc(lang, "Interactive Map Coming Soon", "الخريطة التفاعلية قادمة قريبًا", "Carte interactive bientôt disponible")}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {loc(
                  lang,
                  "We're building an interactive map that will let you explore all locations with clickable markers, route overlays, and detailed information for each place.",
                  "نعمل على بناء خريطة تفاعلية تتيح لك استكشاف جميع المواقع من خلال علامات قابلة للنقر، ومسارات الطرق، ومعلومات تفصيلية لكل مكان.",
                  "Nous construisons une carte interactive qui vous permettra d'explorer tous les lieux avec des marqueurs cliquables, des superpositions d'itinéraires et des informations détaillées pour chaque endroit.",
                )}
              </p>
              <div className="flex gap-3 p-4 rounded-xl border border-gold/20 bg-gold-bg/30 text-xs text-text-secondary">
                <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                <p className="text-start">
                  {loc(
                    lang,
                    `For now, use the search and filter above to explore all ${allPlaces.length} locations across Makkah, Madinah, battlefields, and key routes.`,
                    `في الوقت الحالي، استخدم البحث والتصفية أعلاه لاستكشاف جميع المواقع البالغ عددها ${allPlaces.length} عبر مكة والمدينة وساحات المعارك والطرق الرئيسية.`,
                    `Pour l'instant, utilisez la recherche et le filtre ci-dessus pour explorer les ${allPlaces.length} lieux à travers La Mecque, Médine, les champs de bataille et les routes clés.`,
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="text-sm text-text-muted mb-1">{loc(lang, "Ready to go deeper?", "مستعد للتعمق أكثر؟", "Prêt à aller plus loin ?")}</p>
              <p className="text-base font-semibold text-text">
                {loc(
                  lang,
                  "See these places come to life in the full 100-part Seerah course.",
                  "شاهد هذه الأماكن تنبض بالحياة في دورة السيرة النبوية الكاملة المكونة من ١٠٠ جزء.",
                  "Voyez ces lieux prendre vie dans le cours complet de Sîra en 100 parties.",
                )}
              </p>
            </div>
            <Link
              href="/seerah"
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-ink font-semibold text-sm hover:bg-gold-light transition-colors"
            >
              {loc(lang, "Continue Learning the Seerah", "تابع تعلّم السيرة النبوية", "Continuer à apprendre la Sîra")}
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

// ── Place Card Component ───────────────────────────────────────────────────────

function PlaceCard({ place, lang }: { place: Place; lang: CourseLang }) {
  const categoryColors: Record<string, string> = {
    "Makkah": "bg-gold/10 text-gold border-gold/20",
    "Madinah": "bg-green-500/10 text-green-400 border-green-500/20",
    "Battles": "bg-red-500/10 text-red-400 border-red-500/20",
    "Hijrah Route": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Hajj Locations": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "Routes": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "Arabia": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Outside Arabia": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  const badgeColor = categoryColors[place.category] || "bg-surface-raised text-text-muted border-border";

  const regionOrArea = loc(
    lang,
    place.region || place.area || "",
    place.regionAr || place.areaAr || "",
    place.regionFr || place.areaFr || "",
  );

  return (
    <div className="p-4 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-text">{loc(lang, place.name, place.nameAr, place.nameFr)}</h3>
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${badgeColor}`}>
          {categoryLabel(lang, place.category)}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-gold">{loc(lang, place.type, place.typeAr, place.typeFr)}</p>
        {regionOrArea && (
          <p className="text-xs text-text-muted">{regionOrArea}</p>
        )}
      </div>
      <p className="text-xs text-text-muted italic">{loc(lang, place.connection, place.connectionAr, place.connectionFr)}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{loc(lang, place.description, place.descriptionAr, place.descriptionFr)}</p>
      {place.relatedEvent && (
        <p className="text-xs font-medium text-gold/70">
          → {loc(lang, place.relatedEvent, place.relatedEventAr || "", place.relatedEventFr || "")}
        </p>
      )}
    </div>
  );
}
