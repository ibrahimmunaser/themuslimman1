"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, MapPin, Info } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";

interface Place {
  name: string;
  nameAr: string;
  type: string;
  typeAr: string;
  region?: string;
  regionAr?: string;
  area?: string;
  areaAr?: string;
  connection: string;
  connectionAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  relatedEvent?: string;
  relatedEventAr?: string;
}

interface Route {
  name: string;
  nameAr: string;
  path: string;
  pathAr: string;
  description: string;
  descriptionAr: string;
}

// ── Places Data ────────────────────────────────────────────────────────────────

const MAJOR_CITIES: Place[] = [
  { name: "Makkah", nameAr: "مكة المكرمة", type: "City", typeAr: "مدينة", region: "Hijaz", regionAr: "الحجاز", connection: "Birthplace of the Prophet ﷺ and start of the early mission", connectionAr: "مسقط رأس النبي ﷺ وبداية الدعوة الأولى", description: "Makkah was the city where the Prophet ﷺ was born, where the early call to Islam began, and where Quraysh held power around the Ka'bah.", descriptionAr: "مكة هي المدينة التي وُلد فيها النبي ﷺ، وحيث بدأت الدعوة إلى الإسلام، وحيث كانت قريش تملك السلطة حول الكعبة.", category: "Makkah" },
  { name: "Madinah", nameAr: "المدينة المنورة", type: "City", typeAr: "مدينة", region: "Hijaz", regionAr: "الحجاز", connection: "Hijrah and Islamic state", connectionAr: "الهجرة والدولة الإسلامية", description: "Madinah, formerly known as Yathrib, became the home of the Muslims after the Hijrah and the center of the growing Muslim community.", descriptionAr: "المدينة المنورة، المعروفة سابقًا بيثرب، أصبحت موطن المسلمين بعد الهجرة ومركز المجتمع المسلم المتنامي.", category: "Madinah" },
  { name: "Ta'if", nameAr: "الطائف", type: "City", typeAr: "مدينة", region: "Near Makkah", regionAr: "قرب مكة", connection: "Visit of da'wah and later Islam", connectionAr: "رحلة الدعوة ثم دخولها الإسلام لاحقًا", description: "The Prophet ﷺ traveled to Ta'if seeking support after the Year of Sorrow and was rejected there, though the city later entered Islam.", descriptionAr: "سافر النبي ﷺ إلى الطائف طلبًا للنصرة بعد عام الحزن، فقوبل بالرفض هناك، وإن كانت المدينة قد دخلت الإسلام لاحقًا.", category: "Arabia" },
  { name: "Khaybar", nameAr: "خيبر", type: "Settlement / Oasis region", typeAr: "مستوطنة / منطقة واحة", region: "North of Madinah", regionAr: "شمال المدينة", connection: "Major Madinan campaign", connectionAr: "غزوة مدنية كبرى", description: "Khaybar was a fortified region north of Madinah and the site of a major campaign in the Madinan period.", descriptionAr: "كانت خيبر منطقة محصّنة شمال المدينة، وموقع غزوة كبرى في العهد المدني.", category: "Arabia" },
  { name: "Tabuk", nameAr: "تبوك", type: "Region / expedition destination", typeAr: "منطقة / وجهة غزوة", region: "North Arabia", regionAr: "شمال الجزيرة العربية", connection: "Expedition of Tabuk", connectionAr: "غزوة تبوك", description: "Tabuk marks the destination of one of the last major expeditions in the Prophet's ﷺ life.", descriptionAr: "تبوك هي وجهة إحدى آخر الغزوات الكبرى في حياة النبي ﷺ.", category: "Arabia" },
  { name: "Abyssinia", nameAr: "الحبشة", type: "Kingdom / region", typeAr: "مملكة / منطقة", region: "Across the Red Sea", regionAr: "عبر البحر الأحمر", connection: "Early migration", connectionAr: "الهجرة المبكرة", description: "Abyssinia was the land to which some early Muslims migrated to escape persecution in Makkah.", descriptionAr: "كانت الحبشة الأرض التي هاجر إليها بعض المسلمين الأوائل هربًا من الاضطهاد في مكة.", category: "Outside Arabia" },
  { name: "Mu'tah", nameAr: "مؤتة", type: "Location", typeAr: "موقع", region: "Greater Syria area", regionAr: "منطقة بلاد الشام", connection: "Battle of Mu'tah", connectionAr: "غزوة مؤتة", description: "Mu'tah was the site of a major battle involving the Muslims beyond Arabia.", descriptionAr: "مؤتة هي موقع معركة كبرى خاضها المسلمون خارج الجزيرة العربية.", category: "Outside Arabia" },
];

const MAKKAH_MADINAH_LOCATIONS: Place[] = [
  { name: "Ka'bah", nameAr: "الكعبة", type: "Sacred site", typeAr: "موقع مقدس", area: "Makkah", areaAr: "مكة", connection: "Center of worship", connectionAr: "مركز العبادة", description: "The Ka'bah was the focal point of worship and central to the religious significance of Makkah.", descriptionAr: "كانت الكعبة محور العبادة والمكانة الدينية المركزية لمكة.", category: "Makkah" },
  { name: "Cave of Hira", nameAr: "غار حراء", type: "Cave / mountain location", typeAr: "كهف / موقع جبلي", area: "Near Makkah", areaAr: "قرب مكة", connection: "First revelation", connectionAr: "نزول الوحي الأول", description: "The first revelation came to the Prophet ﷺ in the Cave of Hira on Jabal al-Nur.", descriptionAr: "نزل الوحي الأول على النبي ﷺ في غار حراء في جبل النور.", category: "Makkah" },
  { name: "Cave of Thawr", nameAr: "غار ثور", type: "Cave / mountain location", typeAr: "كهف / موقع جبلي", area: "Near Makkah", areaAr: "قرب مكة", connection: "Hijrah", connectionAr: "الهجرة", description: "The Prophet ﷺ and Abu Bakr رضي الله عنه sheltered in the Cave of Thawr during the Hijrah.", descriptionAr: "احتمى النبي ﷺ وأبو بكر رضي الله عنه في غار ثور أثناء الهجرة.", category: "Hijrah Route" },
  { name: "Mina", nameAr: "منى", type: "Valley", typeAr: "وادٍ", area: "Near Makkah", areaAr: "قرب مكة", connection: "Hajj and pledges", connectionAr: "الحج والبيعات", description: "Mina is connected to the rites of Hajj and to the pledges that helped prepare the way for the Hijrah.", descriptionAr: "ترتبط منى بمناسك الحج وبالبيعات التي مهّدت الطريق للهجرة.", category: "Hajj Locations" },
  { name: "Arafah", nameAr: "عرفة", type: "Plain / sacred site", typeAr: "سهل / موقع مقدس", area: "Near Makkah", areaAr: "قرب مكة", connection: "Hajj", connectionAr: "الحج", description: "Arafah is one of the most important sites of Hajj and is associated with the Farewell Pilgrimage.", descriptionAr: "عرفة من أهم مواقع الحج، وترتبط بحجة الوداع.", category: "Hajj Locations" },
  { name: "Muzdalifah", nameAr: "مزدلفة", type: "Open plain", typeAr: "سهل مفتوح", area: "Near Makkah", areaAr: "قرب مكة", connection: "Hajj", connectionAr: "الحج", description: "Muzdalifah is one of the key locations connected to the rites of Hajj.", descriptionAr: "مزدلفة من أهم المواقع المرتبطة بمناسك الحج.", category: "Hajj Locations" },
  { name: "Quba", nameAr: "قباء", type: "Area / mosque location", typeAr: "منطقة / موقع مسجد", area: "Near Madinah", areaAr: "قرب المدينة", connection: "Arrival after Hijrah", connectionAr: "الوصول بعد الهجرة", description: "Quba was the first stopping place of the Prophet ﷺ upon arriving near Madinah and the site of Quba Mosque.", descriptionAr: "كانت قباء أول محطة توقف فيها النبي ﷺ عند اقترابه من المدينة، وموقع مسجد قباء.", category: "Madinah" },
  { name: "Masjid al-Nabawi", nameAr: "المسجد النبوي", type: "Mosque", typeAr: "مسجد", area: "Madinah", areaAr: "المدينة", connection: "Center of community", connectionAr: "مركز المجتمع", description: "Masjid al-Nabawi became the center of worship, leadership, teaching, and community life in Madinah.", descriptionAr: "أصبح المسجد النبوي مركز العبادة والقيادة والتعليم والحياة المجتمعية في المدينة.", category: "Madinah" },
  { name: "Jannat al-Baqi'", nameAr: "البقيع", type: "Cemetery", typeAr: "مقبرة", area: "Madinah", areaAr: "المدينة", connection: "Burial ground", connectionAr: "مقبرة", description: "Al-Baqi' became the well-known burial place for many companions and family members.", descriptionAr: "أصبح البقيع المقبرة المعروفة للعديد من الصحابة وأفراد الأسرة.", category: "Madinah" },
  { name: "Masjid al-Qiblatayn", nameAr: "مسجد القبلتين", type: "Mosque", typeAr: "مسجد", area: "Madinah", areaAr: "المدينة", connection: "Qiblah change", connectionAr: "تحويل القبلة", description: "This location is associated with the change of the qiblah from Jerusalem to the Ka'bah.", descriptionAr: "يرتبط هذا الموقع بتحويل القبلة من بيت المقدس إلى الكعبة.", category: "Madinah" },
  { name: "Mount Uhud", nameAr: "جبل أُحُد", type: "Mountain", typeAr: "جبل", area: "Madinah", areaAr: "المدينة", connection: "Battle of Uhud", connectionAr: "غزوة أُحُد", description: "Mount Uhud is the site of the famous battle and one of the most important locations in the Madinan Seerah.", descriptionAr: "جبل أُحُد هو موقع الغزوة الشهيرة وأحد أهم المواقع في السيرة المدنية.", category: "Battles" },
  { name: "Trench / Khandaq area", nameAr: "منطقة الخندق", type: "Battlefield zone", typeAr: "منطقة معركة", area: "Madinah", areaAr: "المدينة", connection: "Battle of the Trench", connectionAr: "غزوة الخندق", description: "This area marks where the Muslims dug the trench to defend Madinah from the confederate siege.", descriptionAr: "تحدد هذه المنطقة الموضع الذي حفر فيه المسلمون الخندق للدفاع عن المدينة من حصار الأحزاب.", category: "Battles" },
];

const BATTLES_EXPEDITIONS: Place[] = [
  { name: "Badr", nameAr: "بدر", type: "Battlefield / well area", typeAr: "ساحة معركة / منطقة بئر", connection: "Battle of Badr", connectionAr: "غزوة بدر", description: "Badr was the site of the first major battle between the Muslims and Quraysh.", descriptionAr: "بدر هي موقع أول معركة كبرى بين المسلمين وقريش.", category: "Battles", relatedEvent: "Battle of Badr", relatedEventAr: "غزوة بدر" },
  { name: "Uhud", nameAr: "أُحُد", type: "Battlefield", typeAr: "ساحة معركة", connection: "Battle of Uhud", connectionAr: "غزوة أُحُد", description: "Uhud was the site of a major battle that taught lasting lessons about obedience and discipline.", descriptionAr: "أُحُد هي موقع معركة كبرى علّمت دروسًا خالدة في الطاعة والانضباط.", category: "Battles", relatedEvent: "Battle of Uhud", relatedEventAr: "غزوة أُحُد" },
  { name: "Khandaq", nameAr: "الخندق", type: "Battlefield / defensive zone", typeAr: "ساحة معركة / منطقة دفاعية", connection: "Battle of the Trench", connectionAr: "غزوة الخندق", description: "The confederate forces were held off through the trench strategy around Madinah.", descriptionAr: "صُدّت قوات الأحزاب من خلال استراتيجية حفر الخندق حول المدينة.", category: "Battles", relatedEvent: "Battle of the Trench", relatedEventAr: "غزوة الخندق" },
  { name: "Hudaybiyyah", nameAr: "الحديبية", type: "Outskirts / treaty site", typeAr: "ضواحٍ / موقع معاهدة", connection: "Treaty of Hudaybiyyah", connectionAr: "صلح الحديبية", description: "Hudaybiyyah was the place where the treaty was concluded between the Muslims and Quraysh.", descriptionAr: "الحديبية هي المكان الذي أُبرم فيه الصلح بين المسلمين وقريش.", category: "Routes", relatedEvent: "Treaty of Hudaybiyyah", relatedEventAr: "صلح الحديبية" },
  { name: "Hunayn", nameAr: "حُنين", type: "Valley", typeAr: "وادٍ", connection: "Battle of Hunayn", connectionAr: "غزوة حنين", description: "Hunayn was the site of the battle that followed the conquest of Makkah.", descriptionAr: "حنين هي موقع الغزوة التي تلت فتح مكة.", category: "Battles", relatedEvent: "Battle of Hunayn", relatedEventAr: "غزوة حنين" },
  { name: "Ta'if campaign area", nameAr: "منطقة حملة الطائف", type: "City / siege area", typeAr: "مدينة / منطقة حصار", connection: "After Hunayn", connectionAr: "بعد حنين", description: "The Muslims moved toward Ta'if after Hunayn.", descriptionAr: "توجّه المسلمون نحو الطائف بعد حنين.", category: "Routes", relatedEvent: "Siege of Ta'if", relatedEventAr: "حصار الطائف" },
  { name: "Khaybar", nameAr: "خيبر", type: "Fortified oasis area", typeAr: "منطقة واحة محصّنة", connection: "Khaybar campaign", connectionAr: "غزوة خيبر", description: "Khaybar was a significant northern campaign in the Madinan period.", descriptionAr: "كانت خيبر غزوة شمالية بارزة في العهد المدني.", category: "Battles", relatedEvent: "Khaybar campaign", relatedEventAr: "غزوة خيبر" },
  { name: "Mu'tah", nameAr: "مؤتة", type: "Battle location", typeAr: "موقع معركة", connection: "Battle of Mu'tah", connectionAr: "غزوة مؤتة", description: "Mu'tah was the site of a major expedition facing Byzantine-allied forces.", descriptionAr: "مؤتة هي موقع غزوة كبرى واجه فيها المسلمون قوات موالية للروم.", category: "Battles", relatedEvent: "Battle of Mu'tah", relatedEventAr: "غزوة مؤتة" },
  { name: "Tabuk", nameAr: "تبوك", type: "Expedition destination", typeAr: "وجهة غزوة", connection: "Expedition of Tabuk", connectionAr: "غزوة تبوك", description: "Tabuk was one of the last major expedition destinations during the Prophet's ﷺ life.", descriptionAr: "كانت تبوك إحدى آخر وجهات الغزوات الكبرى في حياة النبي ﷺ.", category: "Routes", relatedEvent: "Expedition of Tabuk", relatedEventAr: "غزوة تبوك" },
  { name: "Ji'ranah", nameAr: "الجعرانة", type: "Location", typeAr: "موقع", connection: "Return from Hunayn", connectionAr: "العودة من حنين", description: "Ji'ranah is associated with events after Hunayn.", descriptionAr: "ترتبط الجعرانة بالأحداث التي تلت غزوة حنين.", category: "Routes", relatedEvent: "After Hunayn", relatedEventAr: "بعد حنين" },
];

const ROUTES: Route[] = [
  { name: "Makkan Da'wah Zone", nameAr: "منطقة الدعوة المكية", path: "Makkah → Cave of Hira → surrounding Quraysh environment", pathAr: "مكة → غار حراء → محيط قريش المجاور", description: "The early phase of the mission centered around Makkah and its vicinity.", descriptionAr: "تمركزت المرحلة الأولى من الدعوة حول مكة وما جاورها." },
  { name: "Hijrah Route", nameAr: "طريق الهجرة", path: "Makkah → Cave of Thawr → route northward → Quba → Madinah", pathAr: "مكة → غار ثور → الطريق شمالًا → قباء → المدينة", description: "The migration route that marked the turning point for the Muslim community.", descriptionAr: "طريق الهجرة الذي شكّل نقطة التحول للمجتمع المسلم." },
  { name: "Ta'if Journey", nameAr: "رحلة الطائف", path: "Makkah → Ta'if → return to Makkah", pathAr: "مكة → الطائف → العودة إلى مكة", description: "The Prophet's ﷺ journey seeking support after the Year of Sorrow.", descriptionAr: "رحلة النبي ﷺ طلبًا للنصرة بعد عام الحزن." },
  { name: "Badr Route", nameAr: "طريق بدر", path: "Madinah → Badr", pathAr: "المدينة → بدر", description: "The route to the first major battle.", descriptionAr: "الطريق إلى أول معركة كبرى." },
  { name: "Hudaybiyyah Route", nameAr: "طريق الحديبية", path: "Madinah → outskirts of Makkah → Hudaybiyyah", pathAr: "المدينة → ضواحي مكة → الحديبية", description: "The journey that led to the treaty between Muslims and Quraysh.", descriptionAr: "الرحلة التي أفضت إلى الصلح بين المسلمين وقريش." },
  { name: "Khaybar Route", nameAr: "طريق خيبر", path: "Madinah → Khaybar", pathAr: "المدينة → خيبر", description: "The northern campaign route from Madinah.", descriptionAr: "طريق الغزوة الشمالية انطلاقًا من المدينة." },
  { name: "Tabuk Route", nameAr: "طريق تبوك", path: "Madinah → Tabuk", pathAr: "المدينة → تبوك", description: "One of the longest expeditions during the Prophet's ﷺ life.", descriptionAr: "إحدى أطول الغزوات في حياة النبي ﷺ." },
  { name: "Abyssinia Migration", nameAr: "هجرة الحبشة", path: "Makkah → Red Sea crossing → Abyssinia", pathAr: "مكة → عبور البحر الأحمر → الحبشة", description: "The migration route for early Muslims escaping persecution.", descriptionAr: "طريق هجرة المسلمين الأوائل هربًا من الاضطهاد." },
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
      results = results.filter((p) =>
        isRtl
          ? p.nameAr.includes(searchQuery) ||
            p.typeAr.includes(searchQuery) ||
            p.connectionAr.includes(searchQuery) ||
            p.descriptionAr.includes(searchQuery) ||
            (p.relatedEventAr && p.relatedEventAr.includes(searchQuery))
          : p.name.toLowerCase().includes(query) ||
            p.type.toLowerCase().includes(query) ||
            p.connection.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            (p.relatedEvent && p.relatedEvent.toLowerCase().includes(query))
      );
    }

    return results;
  }, [searchQuery, selectedCategory, allPlaces, isRtl]);

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
          {isRtl ? "العودة إلى مكتبة المراجع" : "Back to Reference Library"}
        </Link>

        {/* Page header */}
        <div className="mb-12">
          <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
            {isRtl ? "مكتبة المراجع" : "Reference Library"}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            {isRtl ? "الأماكن والخرائط" : "Places and Maps"}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            {isRtl
              ? "مرجع لأهم المدن والطرق والمواقع المذكورة في السيرة."
              : "A reference to the key cities, routes, and locations mentioned in the Seerah."}
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {isRtl
              ? "وقعت أحداث السيرة في مدن ووديان وجبال وساحات معارك وطرق سفر حقيقية. فهم أماكن السيرة يساعد المستخدمين على متابعة القصة بوضوح أكبر ورؤية كيف تشابكت الهجرة والتجارة والقتال والدعوة والعبادة عبر الجزيرة العربية وخارجها."
              : "The Seerah happened across real cities, valleys, mountains, battlefields, and travel routes. Understanding the places of the Seerah helps users follow the story more clearly and see how migration, trade, battle, da'wah, and worship all unfolded across Arabia and beyond."}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: isRtl ? "أماكن رئيسية" : "Key places", value: `${allPlaces.length}+` },
            { label: isRtl ? "طرق رئيسية" : "Major routes", value: `${ROUTES.length}` },
            { label: isRtl ? "مدن" : "Cities", value: `${MAJOR_CITIES.length}` },
            { label: isRtl ? "مواقع المعارك" : "Battle sites", value: `${BATTLES_EXPEDITIONS.filter(p => p.category === "Battles").length}` },
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
              title: isRtl ? "لماذا تهم الأماكن في السيرة" : "Why place matters in the Seerah",
              text: isRtl
                ? "تصبح السيرة أسهل متابعةً عندما يستطيع المستخدمون تحديد أماكن نزول الوحي، والاضطهاد، والهجرة، والمعارك، والمعاهدات، والعبادة."
                : "The Seerah is easier to follow when users can locate where revelation, persecution, migration, battles, treaties, and worship took place.",
            },
            {
              title: isRtl ? "لماذا تهم مكة" : "Why Makkah matters",
              text: isRtl
                ? "مكة هي مسقط رأس النبي ﷺ، وموقع الكعبة، والمكان الذي بدأت فيه الدعوة تحت معارضة قريش."
                : "Makkah is the birthplace of the Prophet ﷺ, the site of the Ka'bah, and the place where the mission began under Quraysh opposition.",
            },
            {
              title: isRtl ? "لماذا تهم المدينة" : "Why Madinah matters",
              text: isRtl
                ? "المدينة هي المكان الذي بنى فيه المسلمون مجتمعهم، وأسّسوا النظام الاجتماعي، وانتقلوا من الاضطهاد إلى القوة بعد الهجرة."
                : "Madinah is where the Muslims built a community, established social order, and moved from persecution to strength after the Hijrah.",
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
              placeholder={isRtl ? "ابحث عن الأماكن أو المدن أو المواقع…" : "Search places, cities, or locations…"}
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
                  {isRtl ? CATEGORY_LABELS_AR[category] : category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Places Grid */}
        {filteredPlaces.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-secondary">
              {isRtl ? "لا توجد أماكن مطابقة لبحثك." : "No places found matching your search."}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 text-sm text-text-muted">
              <MapPin className="w-4 h-4" />
              <span>
                {isRtl
                  ? `عرض ${displayedPlaces.length} من ${filteredPlaces.length} مكانًا`
                  : `Showing ${displayedPlaces.length} of ${filteredPlaces.length} places`}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {displayedPlaces.map((place, index) => (
                <PlaceCard key={index} place={place} isRtl={isRtl} />
              ))}
            </div>

            {/* Show more/less */}
            {filteredPlaces.length > 12 && (
              <div className="text-center mb-12">
                <button
                  onClick={() => setShowAllPlaces(!showAllPlaces)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface border border-border hover:border-gold/40 text-text-secondary hover:text-text font-medium text-sm transition-colors"
                >
                  {isRtl
                    ? showAllPlaces
                      ? "عرض أقل"
                      : `عرض جميع الأماكن (${filteredPlaces.length})`
                    : showAllPlaces
                    ? "Show Less"
                    : `Show All ${filteredPlaces.length} Places`}
                </button>
              </div>
            )}
          </>
        )}

        {/* Routes Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text mb-4">{isRtl ? "الطرق الرئيسية" : "Major Routes"}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {ROUTES.map((route, index) => (
              <div key={index} className="p-4 rounded-xl border border-border bg-surface">
                <h3 className="text-base font-bold text-gold mb-2">{isRtl ? route.nameAr : route.name}</h3>
                <p className="text-xs text-text-muted mb-3 font-mono">{isRtl ? route.pathAr : route.path}</p>
                <p className="text-xs text-text-secondary leading-relaxed">{isRtl ? route.descriptionAr : route.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Map Placeholder */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text mb-4">{isRtl ? "خريطة مرجعية تفاعلية" : "Interactive Reference Map"}</h2>
          <div className="rounded-2xl border-2 border-border bg-surface p-8 text-center">
            <div className="max-w-md mx-auto">
              <MapPin className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-lg font-bold text-text mb-2">
                {isRtl ? "الخريطة التفاعلية قادمة قريبًا" : "Interactive Map Coming Soon"}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {isRtl
                  ? "نعمل على بناء خريطة تفاعلية تتيح لك استكشاف جميع المواقع من خلال علامات قابلة للنقر، ومسارات الطرق، ومعلومات تفصيلية لكل مكان."
                  : "We're building an interactive map that will let you explore all locations with clickable markers, route overlays, and detailed information for each place."}
              </p>
              <div className="flex gap-3 p-4 rounded-xl border border-gold/20 bg-gold-bg/30 text-xs text-text-secondary">
                <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                <p className="text-start">
                  {isRtl
                    ? `في الوقت الحالي، استخدم البحث والتصفية أعلاه لاستكشاف جميع المواقع البالغ عددها ${allPlaces.length} عبر مكة والمدينة وساحات المعارك والطرق الرئيسية.`
                    : `For now, use the search and filter above to explore all ${allPlaces.length} locations across Makkah, Madinah, battlefields, and key routes.`}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="text-sm text-text-muted mb-1">{isRtl ? "مستعد للتعمق أكثر؟" : "Ready to go deeper?"}</p>
              <p className="text-base font-semibold text-text">
                {isRtl
                  ? "شاهد هذه الأماكن تنبض بالحياة في دورة السيرة النبوية الكاملة المكونة من ١٠٠ جزء."
                  : "See these places come to life in the full 100-part Seerah course."}
              </p>
            </div>
            <Link
              href="/seerah"
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-ink font-semibold text-sm hover:bg-gold-light transition-colors"
            >
              {isRtl ? "تابع تعلّم السيرة النبوية" : "Continue Learning the Seerah"}
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
            {isRtl ? "العودة إلى مكتبة المراجع" : "Back to Reference Library"}
          </Link>
        </div>

      </div>
    </main>
  );
}

// ── Place Card Component ───────────────────────────────────────────────────────

function PlaceCard({ place, isRtl }: { place: Place; isRtl: boolean }) {
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

  const regionOrArea = isRtl ? (place.regionAr || place.areaAr) : (place.region || place.area);

  return (
    <div className="p-4 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-text">{isRtl ? place.nameAr : place.name}</h3>
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${badgeColor}`}>
          {isRtl ? CATEGORY_LABELS_AR[place.category] || place.category : place.category}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-gold">{isRtl ? place.typeAr : place.type}</p>
        {regionOrArea && (
          <p className="text-xs text-text-muted">{regionOrArea}</p>
        )}
      </div>
      <p className="text-xs text-text-muted italic">{isRtl ? place.connectionAr : place.connection}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{isRtl ? place.descriptionAr : place.description}</p>
      {(isRtl ? place.relatedEventAr : place.relatedEvent) && (
        <p className="text-xs font-medium text-gold/70">→ {isRtl ? place.relatedEventAr : place.relatedEvent}</p>
      )}
    </div>
  );
}
