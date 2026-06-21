"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Info, Swords, Flag, Shield } from "lucide-react";

interface Event {
  id: number;
  name: string;
  type: string;
  hijriYear: string;
  approximateCE?: string;
  location: string;
  region?: string;
  relatedParties: string;
  summary: string;
  keyLesson: string;
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
    type: "Ghazwah / Major Battle",
    hijriYear: "2 AH",
    approximateCE: "624 CE",
    location: "Badr",
    relatedParties: "Muslims and Quraysh",
    summary: "The first major battle between the Muslims and Quraysh.",
    keyLesson: "Trust in Allah, preparation, unity, and courage.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Quraysh", "Fighting Occurred", "Early Madinan Period"],
    section: "battles",
  },
  {
    id: 2,
    name: "Battle of Uhud",
    type: "Ghazwah / Major Battle",
    hijriYear: "3 AH",
    approximateCE: "625 CE",
    location: "Mount Uhud, near Madinah",
    relatedParties: "Muslims and Quraysh",
    summary: "Quraysh returned after Badr, and the Muslims faced a painful test.",
    keyLesson: "Obedience, discipline, patience, and consequences of disunity.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Quraysh", "Madinah-Related", "Fighting Occurred", "Early Madinan Period"],
    section: "battles",
  },
  {
    id: 3,
    name: "Battle of the Trench / Al-Ahzab",
    type: "Ghazwah / Major Defensive Campaign",
    hijriYear: "5 AH",
    approximateCE: "627 CE",
    location: "Madinah",
    relatedParties: "Muslims and the Confederates",
    summary: "A large coalition came against Madinah, and the Muslims defended the city by digging a trench.",
    keyLesson: "Strategy, consultation, patience, and Allah's protection.",
    importance: "Major",
    fightingOccurred: "Limited",
    categoryTags: ["Major Battles", "Ghazwah", "Madinah-Related", "Fighting Occurred", "Early Madinan Period"],
    section: "battles",
  },
  {
    id: 4,
    name: "Banu Qurayzah",
    type: "Ghazwah / Siege",
    hijriYear: "5 AH",
    location: "Madinah",
    relatedParties: "Muslims and Banu Qurayzah",
    summary: "This event followed the Battle of the Trench and involved treaty betrayal during a time of siege.",
    keyLesson: "Treaties, loyalty, justice, and consequences.",
    importance: "Major",
    fightingOccurred: "Siege",
    categoryTags: ["Major Battles", "Ghazwah", "Jewish Tribes of Madinah", "Madinah-Related", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 5,
    name: "Banu Mustaliq / Al-Muraysi'",
    type: "Ghazwah / Campaign",
    hijriYear: "5 or 6 AH",
    location: "Al-Muraysi'",
    relatedParties: "Muslims and Banu Mustaliq",
    summary: "A campaign connected to Banu Mustaliq and important social events in the Seerah.",
    keyLesson: "Community discipline, handling rumors, and leadership.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Fighting Occurred", "Early Madinan Period"],
    section: "battles",
  },
  {
    id: 6,
    name: "Khaybar",
    type: "Ghazwah / Major Campaign",
    hijriYear: "7 AH",
    approximateCE: "628 CE",
    location: "Khaybar",
    relatedParties: "Muslims and the people of Khaybar",
    summary: "A major campaign against fortified settlements north of Madinah.",
    keyLesson: "Patience, strategy, leadership, and reliance upon Allah.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Fighting Occurred", "Late Madinan Period"],
    section: "battles",
  },
  {
    id: 7,
    name: "Conquest of Makkah",
    type: "Ghazwah / Opening of Makkah",
    hijriYear: "8 AH",
    approximateCE: "630 CE",
    location: "Makkah",
    relatedParties: "Muslims and Quraysh",
    summary: "The Prophet ﷺ entered Makkah victoriously after Quraysh's treaty violation.",
    keyLesson: "Mercy, forgiveness, humility, and the victory of truth.",
    importance: "Major",
    fightingOccurred: "Limited",
    categoryTags: ["Major Battles", "Ghazwah", "Makkah-Related", "Quraysh", "Late Madinan Period"],
    section: "battles",
  },
  {
    id: 8,
    name: "Battle of Hunayn",
    type: "Ghazwah / Major Battle",
    hijriYear: "8 AH",
    approximateCE: "630 CE",
    location: "Hunayn",
    relatedParties: "Muslims, Hawazin, and Thaqif",
    summary: "A major battle shortly after the conquest of Makkah.",
    keyLesson: "Do not rely on numbers; victory comes from Allah.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Fighting Occurred", "Late Madinan Period"],
    section: "battles",
  },
  {
    id: 9,
    name: "Siege of Ta'if",
    type: "Ghazwah / Siege",
    hijriYear: "8 AH",
    approximateCE: "630 CE",
    location: "Ta'if",
    relatedParties: "Muslims and Thaqif",
    summary: "The Muslims moved toward Ta'if after Hunayn.",
    keyLesson: "Patience, restraint, and leaving guidance to Allah.",
    importance: "Major",
    fightingOccurred: "Siege",
    categoryTags: ["Major Battles", "Ghazwah", "Late Madinan Period"],
    section: "campaigns",
  },
  
  // MAJOR CAMPAIGNS AND SIEGES
  {
    id: 10,
    name: "Banu Qaynuqa",
    type: "Ghazwah / Madinan Campaign",
    hijriYear: "2 AH",
    location: "Madinah",
    relatedParties: "Muslims and Banu Qaynuqa",
    summary: "One of the early Madinan treaty-related conflicts.",
    keyLesson: "Community security and treaty responsibility.",
    importance: "Medium",
    fightingOccurred: "Siege",
    categoryTags: ["Ghazwah", "Jewish Tribes of Madinah", "Madinah-Related", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 11,
    name: "Sawiq Campaign",
    type: "Ghazwah / Pursuit Campaign",
    hijriYear: "2 AH",
    location: "Around Madinah",
    relatedParties: "Muslims and Abu Sufyan's party",
    summary: "A pursuit after an attack connected to Quraysh hostility.",
    keyLesson: "Readiness and protection of the community.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Ghazwah", "Quraysh", "Madinah-Related", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 12,
    name: "Dhu Amarr / Ghatafan Campaign",
    type: "Ghazwah",
    hijriYear: "3 AH",
    location: "Najd region",
    relatedParties: "Muslims and Ghatafan-related groups",
    summary: "A campaign connected to threats from Najd.",
    keyLesson: "Deterrence and vigilance.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 13,
    name: "Bahran Campaign",
    type: "Ghazwah",
    hijriYear: "3 AH",
    location: "Bahran",
    relatedParties: "Muslims and tribal groups",
    summary: "A campaign during the early Madinan period.",
    keyLesson: "Monitoring threats and maintaining security.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 14,
    name: "Hamra al-Asad",
    type: "Ghazwah / Pursuit Campaign",
    hijriYear: "3 AH",
    location: "Near Madinah",
    relatedParties: "Muslims and Quraysh",
    summary: "The Muslims pursued Quraysh after Uhud to show strength and prevent another attack.",
    keyLesson: "Resilience after hardship.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Quraysh", "Madinah-Related", "No Fighting", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 15,
    name: "Banu Nadir",
    type: "Ghazwah / Siege",
    hijriYear: "4 AH",
    location: "Madinah",
    relatedParties: "Muslims and Banu Nadir",
    summary: "A major Madinan treaty-related event that led to the removal of Banu Nadir.",
    keyLesson: "Treaty responsibility and internal security.",
    importance: "Major",
    fightingOccurred: "Siege",
    categoryTags: ["Ghazwah", "Jewish Tribes of Madinah", "Madinah-Related", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 16,
    name: "Dhat al-Riqa'",
    type: "Ghazwah",
    hijriYear: "4 or 5 AH",
    location: "Najd region",
    relatedParties: "Muslims and tribal groups",
    summary: "A campaign connected to threats from tribes in the Najd region.",
    keyLesson: "Prayer in danger, readiness, and discipline.",
    importance: "Medium",
    fightingOccurred: "Limited",
    categoryTags: ["Ghazwah", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 17,
    name: "Dumat al-Jandal",
    type: "Ghazwah",
    hijriYear: "5 AH",
    location: "Northern Arabia",
    relatedParties: "Muslims and northern tribal groups",
    summary: "A northern campaign connected to securing routes and responding to threats.",
    keyLesson: "Strategic reach and protecting the community.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 18,
    name: "Banu Lahyan",
    type: "Ghazwah",
    hijriYear: "6 AH",
    location: "Region connected to Hudhayl",
    relatedParties: "Muslims and Banu Lahyan",
    summary: "A campaign connected to earlier harm suffered by Muslim teachers and envoys.",
    keyLesson: "Justice, memory, and caution in da'wah missions.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Late Madinan Period"],
    section: "campaigns",
  },
  {
    id: 19,
    name: "Dhu Qarad / Al-Ghabah",
    type: "Ghazwah / Pursuit Campaign",
    hijriYear: "6 AH",
    location: "Near Madinah",
    relatedParties: "Muslims and raiders",
    summary: "A pursuit after livestock were attacked near Madinah.",
    keyLesson: "Quick response and community protection.",
    importance: "Medium",
    fightingOccurred: "Limited",
    categoryTags: ["Ghazwah", "Madinah-Related", "Late Madinan Period"],
    section: "campaigns",
  },
  {
    id: 20,
    name: "Hudaybiyyah",
    type: "Ghazwah / Treaty Event",
    hijriYear: "6 AH",
    approximateCE: "628 CE",
    location: "Hudaybiyyah, near Makkah",
    relatedParties: "Muslims and Quraysh",
    summary: "The Muslims set out for Umrah but were prevented, leading to the Treaty of Hudaybiyyah.",
    keyLesson: "Long-term wisdom, patience, and strategic peace.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Treaty Events", "Makkah-Related", "Quraysh", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
  {
    id: 21,
    name: "Umrat al-Qada",
    type: "Journey / Fulfilled Umrah",
    hijriYear: "7 AH",
    location: "Makkah",
    relatedParties: "Muslims and Quraysh",
    summary: "The Muslims returned to perform the Umrah they had been prevented from performing the year before.",
    keyLesson: "Patience and fulfillment of agreements.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Makkah-Related", "Quraysh", "Treaty Events", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
  {
    id: 22,
    name: "Tabuk",
    type: "Ghazwah / Major Expedition",
    hijriYear: "9 AH",
    approximateCE: "630 CE",
    location: "Tabuk",
    relatedParties: "Muslims and northern Byzantine-linked threat",
    summary: "One of the last major expeditions in the Prophet's ﷺ life.",
    keyLesson: "Sacrifice, sincerity, hardship, and exposing hypocrisy.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Late Madinan Period"],
    section: "campaigns",
  },
  
  // KEY EXPEDITIONS AND PATROLS
  {
    id: 23,
    name: "Expedition of Hamzah ibn Abd al-Muttalib",
    type: "Sariyyah / Patrol",
    hijriYear: "1 AH",
    location: "Toward the Red Sea route",
    relatedParties: "Muslims and Quraysh caravan route",
    summary: "One of the earliest Muslim patrols after the Hijrah.",
    keyLesson: "Establishing presence and protecting the new community.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Sariyyah", "Quraysh", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 24,
    name: "Expedition of Ubaydah ibn al-Harith",
    type: "Sariyyah / Patrol",
    hijriYear: "1 AH",
    location: "Rabigh area",
    relatedParties: "Muslims and Quraysh",
    summary: "An early patrol during the first year after Hijrah.",
    keyLesson: "Early defense and organized leadership.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Quraysh", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 25,
    name: "Expedition of Sa'd ibn Abi Waqqas to al-Kharrar",
    type: "Sariyyah / Patrol",
    hijriYear: "1 AH",
    location: "Al-Kharrar",
    relatedParties: "Muslims and Quraysh caravan route",
    summary: "An early patrol led by Sa'd ibn Abi Waqqas رضي الله عنه.",
    keyLesson: "Readiness and discipline.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Sariyyah", "Quraysh", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 26,
    name: "Al-Abwa / Waddan",
    type: "Ghazwah",
    hijriYear: "1 AH",
    location: "Al-Abwa / Waddan",
    relatedParties: "Muslims and local tribal groups",
    summary: "One of the earliest campaigns the Prophet ﷺ personally went out on.",
    keyLesson: "Establishing treaties and presence outside Madinah.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 27,
    name: "Buwat",
    type: "Ghazwah",
    hijriYear: "2 AH",
    location: "Buwat",
    relatedParties: "Muslims and Quraysh caravan route",
    summary: "A campaign connected to Quraysh caravan movement.",
    keyLesson: "Strategic pressure and community security.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Quraysh", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 28,
    name: "Al-Ushayrah",
    type: "Ghazwah",
    hijriYear: "2 AH",
    location: "Al-Ushayrah",
    relatedParties: "Muslims and Quraysh caravan route",
    summary: "A campaign before Badr connected to Quraysh caravan activity.",
    keyLesson: "Monitoring threats and economic pressure.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Quraysh", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 29,
    name: "First Badr / Safwan",
    type: "Ghazwah / Pursuit",
    hijriYear: "2 AH",
    location: "Badr area",
    relatedParties: "Muslims and Karaz ibn Jabir",
    summary: "A pursuit before the major Battle of Badr.",
    keyLesson: "Protecting Madinah and responding to attacks.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Madinah-Related", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 30,
    name: "Nakhlah",
    type: "Sariyyah",
    hijriYear: "2 AH",
    location: "Nakhlah",
    relatedParties: "Muslims and Quraysh",
    summary: "A serious early expedition before Badr that raised important legal and ethical questions.",
    keyLesson: "Obedience, sacred limits, and revelation-guided correction.",
    importance: "Medium",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Quraysh", "Fighting Occurred", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 31,
    name: "Al-Qaradah",
    type: "Sariyyah",
    hijriYear: "3 AH",
    location: "Najd trade route",
    relatedParties: "Muslims and Quraysh caravan",
    summary: "A mission that affected Quraysh's trade route after Badr.",
    keyLesson: "Strategic pressure and changing power dynamics.",
    importance: "Medium",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Quraysh", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 32,
    name: "Qatan",
    type: "Sariyyah",
    hijriYear: "4 AH",
    location: "Qatan",
    relatedParties: "Muslims and Banu Asad-related threat",
    summary: "A mission connected to reports of tribal threat.",
    keyLesson: "Preventive security and intelligence.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 33,
    name: "Abdullah ibn Unays Mission",
    type: "Sariyyah / Targeted Mission",
    hijriYear: "4 AH",
    location: "Outside Madinah",
    relatedParties: "Muslims and hostile tribal leadership",
    summary: "A mission connected to a threat against Madinah.",
    keyLesson: "Leadership, risk, and protection.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Madinah-Related", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 34,
    name: "Al-Raji'",
    type: "Sariyyah / Da'wah Mission",
    hijriYear: "4 AH",
    location: "Al-Raji'",
    relatedParties: "Muslim teachers and hostile tribes",
    summary: "A tragic mission where Muslim teachers were betrayed.",
    keyLesson: "Sacrifice, betrayal, and the danger faced by callers to Islam.",
    importance: "Medium",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Fighting Occurred", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 35,
    name: "Bi'r Ma'unah",
    type: "Sariyyah / Da'wah Mission",
    hijriYear: "4 AH",
    location: "Bi'r Ma'unah",
    relatedParties: "Muslim teachers and hostile tribes",
    summary: "A tragic event where many Qur'an reciters were killed.",
    keyLesson: "Sacrifice, grief, and the cost of da'wah.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Fighting Occurred", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 36,
    name: "Abu Salamah Expedition to Qatan",
    type: "Sariyyah",
    hijriYear: "4 AH",
    location: "Qatan",
    relatedParties: "Muslims and Banu Asad-related groups",
    summary: "A mission responding to tribal threat.",
    keyLesson: "Community protection and response to danger.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 37,
    name: "Zayd ibn Harithah Expeditions",
    type: "Sariyyah",
    hijriYear: "Multiple missions",
    location: "Various routes",
    relatedParties: "Muslims and hostile groups",
    summary: "Zayd ibn Harithah رضي الله عنه led multiple missions during the Madinan period.",
    keyLesson: "Trusted leadership and service.",
    importance: "Reference",
    fightingOccurred: "Disputed",
    categoryTags: ["Sariyyah", "Early Madinan Period", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 38,
    name: "Dhat al-Salasil",
    type: "Sariyyah",
    hijriYear: "8 AH",
    location: "Northern Arabia",
    relatedParties: "Muslims and northern tribes",
    summary: "An expedition led by Amr ibn al-As رضي الله عنه.",
    keyLesson: "Leadership, obedience, and unity among commanders.",
    importance: "Medium",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 39,
    name: "Mu'tah",
    type: "Major Expedition / Usually called Ghazwah",
    hijriYear: "8 AH",
    approximateCE: "629 CE",
    location: "Mu'tah",
    relatedParties: "Muslims and Byzantine-allied forces",
    summary: "A major battle outside Arabia led by Zayd ibn Harithah, Ja'far ibn Abi Talib, and Abdullah ibn Rawahah رضي الله عنهم.",
    keyLesson: "Courage, sacrifice, and leadership succession.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Ghazwah", "Fighting Occurred", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 40,
    name: "Expedition of Khalid ibn al-Walid to Banu Jadhimah",
    type: "Sariyyah",
    hijriYear: "8 AH",
    location: "Banu Jadhimah",
    relatedParties: "Muslims and Banu Jadhimah",
    summary: "A serious incident after the conquest of Makkah.",
    keyLesson: "Restraint, justice, and correcting mistakes.",
    importance: "Medium",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Fighting Occurred", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 41,
    name: "Expedition of Ali ibn Abi Talib to Yemen",
    type: "Sariyyah / Da'wah and Governance Mission",
    hijriYear: "10 AH",
    location: "Yemen",
    relatedParties: "Muslims and Yemeni tribes",
    summary: "Ali رضي الله عنه was sent to Yemen for da'wah and judgment.",
    keyLesson: "Teaching, justice, and spreading Islam with knowledge.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Sariyyah", "No Fighting", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 42,
    name: "Expedition of Usamah ibn Zayd",
    type: "Sariyyah / Final Ordered Expedition",
    hijriYear: "11 AH",
    location: "Toward the Syrian frontier",
    relatedParties: "Muslims and northern frontier threat",
    summary: "The Prophet ﷺ appointed Usamah ibn Zayd رضي الله عنه to lead an army near the end of his life.",
    keyLesson: "Trusting young leadership and obeying prophetic instruction.",
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
    type: "Community Agreement",
    hijriYear: "1 AH",
    location: "Madinah",
    relatedParties: "Muslims, Jewish tribes, and other Madinan groups",
    summary: "A foundational agreement organizing the Madinan community.",
    keyLesson: "Governance, rights, duties, and social order.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Treaty Events", "Madinah-Related", "Jewish Tribes of Madinah", "No Fighting", "Early Madinan Period"],
    section: "treaties",
  },
  {
    id: 102,
    name: "Treaty of Hudaybiyyah",
    type: "Treaty",
    hijriYear: "6 AH",
    location: "Hudaybiyyah",
    relatedParties: "Muslims and Quraysh",
    summary: "A peace treaty that appeared difficult but became a clear opening for Islam.",
    keyLesson: "Strategic patience and trust in Allah's plan.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Treaty Events", "Makkah-Related", "Quraysh", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
  {
    id: 103,
    name: "Letters to Rulers",
    type: "Diplomatic Mission",
    hijriYear: "6–7 AH",
    location: "Arabia and beyond",
    relatedParties: "Regional rulers and empires",
    summary: "The Prophet ﷺ sent letters inviting rulers to Islam.",
    keyLesson: "Global da'wah and confident leadership.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Treaty Events", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
  {
    id: 104,
    name: "Year of Delegations",
    type: "Delegations / Diplomacy",
    hijriYear: "9 AH",
    location: "Madinah",
    relatedParties: "Arab tribes",
    summary: "Tribes from across Arabia came to Madinah to meet the Prophet ﷺ.",
    keyLesson: "Islam spreading through teaching, leadership, and diplomacy.",
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

const CALLOUT_CARDS = [
  {
    id: "c1",
    title: "Ghazwah vs Sariyyah",
    text: "A Ghazwah is an expedition the Prophet ﷺ personally went out on. A Sariyyah is an expedition sent by the Prophet ﷺ but led by a companion.",
  },
  {
    id: "c2",
    title: "Not every expedition involved fighting",
    text: "Many campaigns were patrols, treaty missions, deterrence efforts, da'wah missions, or strategic movements where no major battle occurred.",
  },
  {
    id: "c3",
    title: "Why Badr mattered",
    text: "Badr was the first major battle and became a turning point for the Muslim community in Madinah.",
  },
  {
    id: "c4",
    title: "Why Uhud mattered",
    text: "Uhud taught painful lessons about obedience, discipline, patience, and staying firm after hardship.",
  },
  {
    id: "c5",
    title: "Why Hudaybiyyah mattered",
    text: "Hudaybiyyah showed that a treaty that looks difficult in the moment can become a major opening later.",
  },
  {
    id: "c6",
    title: "Why the Conquest of Makkah mattered",
    text: "The conquest showed the Prophet's ﷺ mercy, humility, and forgiveness at the moment of victory.",
  },
  {
    id: "c7",
    title: "Why Tabuk mattered",
    text: "Tabuk tested sacrifice, sincerity, and readiness during hardship near the end of the Prophet's ﷺ life.",
  },
];

export function BattlesExpeditionsContent() {
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
      events = events.filter(
        (event) =>
          event.name.toLowerCase().includes(query) ||
          event.type.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.relatedParties.toLowerCase().includes(query) ||
          event.keyLesson.toLowerCase().includes(query) ||
          event.summary.toLowerCase().includes(query)
      );
    }

    return events;
  }, [searchQuery, selectedCategory]);

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
    <main className="min-h-screen bg-ink py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link
          href="/reference"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reference Library
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
            Reference Library
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Battles and Expeditions
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-3xl mb-6">
            The Seerah includes battles, defensive campaigns, patrols, treaties,
            and expeditions. These events show how the Muslim community moved
            from persecution in Makkah to survival, protection, treaty-making,
            leadership, and mercy in Madinah.
          </p>

          {/* Educational note */}
          <div className="flex gap-3 p-4 rounded-xl bg-surface border border-border/50">
            <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-text-secondary leading-relaxed">
                Seerah books often use two terms:{" "}
                <span className="font-semibold text-text">Ghazwah</span> and{" "}
                <span className="font-semibold text-text">Sariyyah</span>. A
                Ghazwah is an expedition the Prophet ﷺ personally went out on,
                whether or not fighting occurred. A Sariyyah is an expedition
                sent by the Prophet ﷺ but led by a companion. Scholars differ on
                the exact number of campaigns and expeditions, so this section
                focuses on the major and commonly referenced events.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{majorBattlesCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              Major fighting campaigns
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{ghazwahCount}+</p>
            <p className="text-xs text-text-secondary mt-1">
              Campaigns referenced
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{totalCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              Battles, patrols, expeditions
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{sariyyahCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              Expeditions (Sariyyah)
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
                {card.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {card.text}
              </p>
            </div>
          ))}
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search battles, expeditions, places, or lessons…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
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
                {category}
              </button>
            );
          })}
        </div>

        {/* Events grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted">
              No events match your search or filter.
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
                          {event.name}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          {event.type}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="font-medium">Date:</span>
                        <span>
                          {event.hijriYear}
                          {event.approximateCE && ` / ${event.approximateCE}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="font-medium">Location:</span>
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="font-medium">Parties:</span>
                        <span className="line-clamp-1">
                          {event.relatedParties}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-text-secondary leading-relaxed mb-3">
                      {event.summary}
                    </p>

                    <div className="pt-3 border-t border-border space-y-2">
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-1">
                          Key Lesson:
                        </p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {event.keyLesson}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded border text-xs font-medium ${getImportanceBadge(
                            event.importance
                          )}`}
                        >
                          {event.importance}
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
                          {event.fightingOccurred === "Yes"
                            ? "Fighting"
                            : event.fightingOccurred === "No"
                            ? "No Fighting"
                            : event.fightingOccurred}
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
                    ? "Show Less"
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
              Continue Learning the Seerah
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Go back to the full Seerah course to study the context, lessons,
              and details of these events.
            </p>
            <Link
              href="/seerah"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-ink font-semibold hover:bg-gold-light transition-colors"
            >
              Go to Seerah Course
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
            Back to Reference Library
          </Link>
        </div>
      </div>
    </main>
  );
}
