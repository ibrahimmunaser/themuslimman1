import { PARTS } from "./content";
import { ERA_MAP } from "./types";

export interface TimelineEntry {
  partNumber: number;
  title: string;
  subtitle: string;
  era: string;
  eraLabel: string;
  eraColor: string;
  description: string;
  previousEventTitle: string | null;
  previousEventSubtitle: string | null;
  previousEventSummary: string | null;
  currentEventTitle: string;
  currentEventSubtitle: string;
  currentEventSummary: string;
  nextEventTitle: string | null;
  nextEventSubtitle: string | null;
  nextEventSummary: string | null;
  whyItMatters: string;
  fullTimelinePosition: string;
  lessonHref: string;
  nextLessonHref: string | null;
  prevLessonHref: string | null;
}

// Custom "why it matters" for each of the 100 parts
const WHY_IT_MATTERS: Record<number, string> = {
  1:   "Understanding pre-Islamic Arabia helps students see the magnitude of the transformation Islam brought — the world the Prophet ﷺ was sent to change.",
  2:   "The tribal migrations and genealogies of the Arabs reveal the social fabric Islam would unite under one brotherhood, transcending tribe and blood.",
  3:   "Yemen's political history shows how regional power struggles shaped the geopolitical context into which the Prophet ﷺ was born.",
  4:   "Hirah illustrates how Arab identity persisted even under foreign empires — a pride that Islam would redirect toward a higher loyalty.",
  5:   "The Ghassanids show that Arab rulers served as buffers between great powers — a political reality that shaped how Islam eventually spread northward.",
  6:   "The custodianship of Makkah explains why Quraysh had so much to lose when the Prophet ﷺ began calling them to leave their idols.",
  7:   "The drift from tawhid to shirk in Arabia explains why the Prophet's ﷺ core message — 'La ilaha illAllah' — was so revolutionary and so resisted.",
  8:   "Seeing the full religious landscape of pre-Islamic Arabia — not just idolatry, but also Judaism, Christianity, and hanifism — helps students understand why Islam came as a completion, not just a correction.",
  9:   "The social structure of Arabia — tribal honor codes, gender injustices, class hierarchies — shows exactly what Islam came to reform.",
  10:  "The economic realities of pre-Islamic Arabia reveal the systemic injustices Islam addressed directly: exploitation of the poor, dishonest trade, and contempt for the vulnerable.",
  11:  "Tracing the Prophet's ﷺ lineage connects him to Ibrahim ﷺ, Ismail ﷺ, and the Abrahamic promise that a great prophet would come from the Arab people.",
  12:  "The Hashimite family shows the immediate human network around the Prophet ﷺ — who protected him, who nurtured him, and who would later stand with or against him.",
  13:  "The early life of the Prophet ﷺ — born without a father, raised in the desert, returned to a widowed mother — shows the divine hand shaping a man for the greatest mission in history.",
  14:  "The Prophet's ﷺ pre-revelation character establishes that Islam was not a sudden personality change but the full expression of who he always was.",
  15:  "The first revelation is the hinge of all human history. Understanding its details — the cave, the embrace, Khadijah's response — grounds students in the reality of how prophethood began.",
  16:  "Understanding how revelation came to the Prophet ﷺ deepens appreciation for the Quran itself — not as a book he wrote, but as a message delivered through forms that were often overwhelming.",
  17:  "The secret, person-by-person growth of early Islam teaches that movements of truth often begin small, quiet, and among the most sincere — not among the powerful.",
  18:  "The establishment of prayer as the first ritual shows that Islam's foundation is not ideas alone but embodied worship — the salah that anchors every believer's day.",
  19:  "The transition to open preaching marks the moment the Prophet ﷺ accepted that he could no longer protect the message by keeping it private — a lesson in courage over comfort.",
  20:  "Climbing Mount Safa and calling out 'O Quraysh!' was an act of extraordinary courage. This part teaches what it looks like to speak truth to power regardless of consequence.",
  21:  "Quraysh's opposition strategies — mockery, accusations, propaganda — are among the earliest documented cases of systematic counter-messaging against a religious movement.",
  22:  "The stories of Bilal, Sumayyah, and Yasir are not tragic footnotes — they are the foundation of Islamic martyrdom theology, proving that the early community's faith was tested to its absolute limit.",
  23:  "The first Hijrah to Abyssinia teaches that when a Muslim community faces existential threat, migration is not defeat but wisdom — and that justice can be found even among non-Muslim rulers.",
  24:  "Quraysh's mission to Abyssinia, and the Negus's refusal to comply, shows that even in hostile times, truth has the power to move just leaders.",
  25:  "The escalation of hostilities in Makkah shows students that evil rarely backs down when confronted — and that early Muslim endurance was not passive but active and principled.",
  26:  "The conversions of Hamzah and Umar رضي الله عنهما show that even the most determined opponents of truth can become its greatest champions.",
  27:  "Quraysh's shifting strategies reveal that when a movement of truth cannot be defeated by force, its enemies try negotiation — and how the Prophet ﷺ responded teaches the limits of principled concession.",
  28:  "The Boycott of Banu Hashim is one of the most underappreciated crises of the Makkahn period. Three years of near-starvation remind students that commitment to truth has a real-world cost.",
  29:  "The final negotiations show that Quraysh had exhausted every option. Their failure to break the Prophet ﷺ proves the Seerah's central lesson: the message was never about personal gain.",
  30:  "The Year of Grief reminds us that prophets experience profound personal loss — and that divine mission does not exempt a person from grief, but provides a framework for enduring it.",
  31:  "The Prophet's ﷺ dua after being pelted in Taif — praying for the city's children, not revenge — defines Islamic mercy at its most profound.",
  32:  "The pre-Hijrah dawah to tribes during Hajj shows a man who kept trying, systematically, even when every door seemed closed — a model of patient perseverance.",
  33:  "The eleventh year of prophethood is the threshold of the great change. Students who understand this moment feel the tension of a community on the edge of something historically transformative.",
  34:  "The Isra and Mi'raj links the Prophet ﷺ to every previous prophet, establishes the centrality of Jerusalem, and gifts the Ummah the prayer — it is the theological heart of the Seerah.",
  35:  "The First Pledge of Aqabah shows that the Hijrah did not happen by accident — it was the result of years of careful dawah to specific people who were ready to receive it.",
  36:  "The Second Pledge of Aqabah is a covenant that changed history: seventy-three people from a city the Prophet ﷺ had never lived in pledging to protect him with their lives.",
  37:  "The Quraysh assassination plot and the miraculous escape from Makkah show divine protection at its most dramatic — and Abu Bakr's companionship at its most faithful.",
  38:  "The actual journey of the Hijrah — Cave Thawr, the desert road, the arrival in Quba — is filled with human detail that makes the great migration feel vivid and real, not merely symbolic.",
  39:  "The foundation of the Madinan community shows the Prophet ﷺ as a statesman and community builder, not just a preacher. Islam came to build a civilization.",
  40:  "The practical details of Madinah's early construction — who built what, who was paired with whom — make the brotherhood between Muhajirun and Ansar tangible and instructive.",
  41:  "The Constitution of Madinah is one of history's most remarkable documents — a multi-community social contract that recognized rights, defined responsibilities, and created a shared public order.",
  42:  "An in-depth study of the Pact of Madinah reveals the Prophet's ﷺ political genius: creating a framework for coexistence without compromising Islamic principles.",
  43:  "The Quranic permission for defensive combat — its timing, conditions, limitations — shows that Islamic military action was always principled, not reactionary.",
  44:  "The pre-Badr expeditions show how the Prophet ﷺ built military capacity and intelligence systematically before the decisive confrontation.",
  45:  "Badr is the defining military event of the Seerah. 313 believers against 1,000. Divine assistance made visible. This part helps students understand why the Quran calls it 'the Day of Criterion.'",
  46:  "Badr's human stories — sons fighting fathers, brothers facing brothers — reveal the radical realignment of loyalty that Islam required and the depth of commitment the Sahabah demonstrated.",
  47:  "How the Prophet ﷺ treated the prisoners of Badr — with deliberation, consultation, and humanity — establishes an Islamic standard for the treatment of captured enemies ahead of its time.",
  48:  "The strategic landscape after Badr shows that one victory, however decisive, does not end opposition. The Muslim community had to manage the new reality of being a recognized power.",
  49:  "Madinah's internal dynamics after Badr — the hypocrites, the Jewish tribes, the growing Ansar confidence — show that external enemies were only part of the challenge.",
  50:  "The response to Banu Qaynuqa and the Sawiq expedition shows how the Prophet ﷺ managed internal covenant-breakers and external provocateurs with decisiveness and proportionality.",
  51:  "The third year's community actions show Islam in the process of becoming a mature polity, not merely a religious movement.",
  52:  "Understanding how Quraysh prepared for Uhud helps students appreciate what the Muslim community faced and why the battle unfolded the way it did.",
  53:  "The pre-Uhud strategic debate — inside or outside Madinah? — is one of the most instructive leadership moments in the Seerah, carrying lessons about consultation and trust.",
  54:  "The composition of the Muslim army at Uhud — especially Abdullah ibn Ubayy's desertion — shows how internal weakness can be as dangerous as external enemies.",
  55:  "The positioning of the archers and the Prophet's ﷺ explicit command is the setup for the Seerah's most famous lesson about obedience and its consequences.",
  56:  "The opening of Uhud shows how close to victory the believers came — making the reversal that followed all the more instructive for every Muslim who studies it.",
  57:  "The reversal at Uhud — from near-victory to near-defeat in minutes — is the Seerah's most powerful lesson about following the Prophet ﷺ and the consequences of prioritizing worldly gain.",
  58:  "The companions who formed a human shield around the wounded Prophet ﷺ at Uhud represent the apex of Sahabi loyalty — among the most moving stories in all of Islamic history.",
  59:  "The aftermath of Uhud — the grief, the Prophetic guidance, the mutilation of martyrs — shows how a leader guides a community through its darkest moment without allowing despair to take root.",
  60:  "The march to Hamra' al-Asad the day after Uhud — with wounded men barely able to walk — is one of the most striking demonstrations of Muslim resilience in the entire Seerah.",
  61:  "The post-Uhud military engagements show a community that refused to be defined by its defeat, choosing instead to project strength and continue its mission despite real suffering.",
  62:  "The complex landscape of years 4-5 AH shows that the road to security passed through many smaller tests — each a lesson in adaptive leadership.",
  63:  "The Battle of the Confederates — 10,000 at the gates, the trench, the divine wind — is among the most dramatic events in Islamic history, and among the clearest examples of divine intervention.",
  64:  "The judgment on Banu Quraydhah shows the Prophet's ﷺ commitment to justice and covenant law even with those who had betrayed him.",
  65:  "The campaign of Banu al-Mustaliq, the slander against Aisha رضي الله عنها, and the exposure of the hypocrites combine to make this one of the most theologically rich parts of the Seerah.",
  66:  "The sixth year's strategic maneuvering before Hudaybiyah shows careful political preparation — a reminder that great outcomes are rarely accidental.",
  67:  "Hudaybiyah is perhaps the most misunderstood event in the Seerah. Students who understand why Allah called it a 'clear victory' will have grasped something essential about wisdom.",
  68:  "The two-year period after Hudaybiyah saw more people enter Islam than in all previous years combined — a political agreement became the greatest dawah strategy.",
  69:  "The Prophet's ﷺ letters to world rulers show a man who understood that his message was not for Arabia alone but for all of humanity.",
  70:  "The Muqawqas's response shows how worldly power so often recognizes truth but cannot bring itself to surrender to it.",
  71:  "The Persian emperor's contemptuous response to the Prophet ﷺ and its consequences stands as one of history's most vivid lessons about the folly of arrogance before truth.",
  72:  "Abu Sufyan's testimony before Heraclius is a remarkable piece of historical evidence — a Qurayshi enemy reluctantly confirming the Prophet's ﷺ truthfulness to a Byzantine emperor.",
  73:  "The acceptance of Islam by al-Bahrayn's rulers shows how the Prophetic diplomatic mission succeeded through the power of the message itself, where force was not used.",
  74:  "Hawdha ibn Ali's demand for political concessions — and the Prophet's ﷺ refusal — shows that the Prophetic mission was never for sale.",
  75:  "The invitation to the Ghassanid ruler sets in motion events that would eventually lead to the great northern expeditions — showing that every diplomatic act has long-term consequences.",
  76:  "The acceptance of Islam in Oman shows the geographic breadth of the Prophetic mission — reaching people at the farthest coastal corners of Arabia through letters and envoys.",
  77:  "The Dhu Qarad expedition shows that even in the later, more secure phases of the Madinan period, the Prophet ﷺ remained personally vigilant in protecting his community.",
  78:  "The Conquest of Khaybar marks a turning point where the Muslim community proved it could overcome coordinated, fortified opposition.",
  79:  "The strategic analysis of Khaybar reveals why it was targeted when it was — and how its conquest changed the balance of power in the Hijaz permanently.",
  80:  "Khaybar's aftermath — the agricultural settlement, the return of Abyssinian emigrants — shows how victory was consolidated through justice, not plunder.",
  81:  "The post-coalition campaigns show the systematic clearing of obstacles between Madinah and the ultimate goal: the peaceful return to Makkah.",
  82:  "The northern expeditions of the 8th year — including Mu'tah, where 3,000 Muslims faced vastly larger forces — reveal both the courage of the Sahabah and the strategic limits that still existed.",
  83:  "The secret preparation for the Conquest of Makkah shows the Prophet ﷺ at his most politically astute — moving 10,000 to the gates of Makkah before the city knew he was coming.",
  84:  "The Conquest of Makkah is the emotional and spiritual climax of the Seerah. Twenty years of patience culminate in a bloodless return and an act of general amnesty.",
  85:  "Hunayn shows that military success does not guarantee spiritual safety — that pride in numbers, not trust in Allah, leads to near-disaster.",
  86:  "The distribution at al-Ji'ranah and the Prophet's ﷺ address to the Ansar is one of the most emotionally powerful leadership moments in the entire Seerah.",
  87:  "The Hawazin delegation's plea and the Prophet's ﷺ generous response shows that in Islamic leadership, mercy to a defeated enemy is not weakness but strategic wisdom.",
  88:  "The ninth year's delegations show an Arabian peninsula transformed — tribe after tribe choosing Islam not by coercion but by recognition of the Prophet's truth.",
  89:  "The call for Tabuk tested the Ummah as no campaign before it. The heat, the distance, the Byzantine threat — and the Prophet's ﷺ insistence on going — reveal what true leadership costs.",
  90:  "Tabuk's 'Army of Hardship' is one of the Seerah's greatest testaments to the Sahabah's faith. Their sacrifices — some giving everything they owned — define Islamic generosity at its apex.",
  91:  "The revelations of Surah al-Tawbah during Tabuk permanently defined the status of the hypocrites and the standard for sincere belief — making this one of the most consequential moments in the Seerah.",
  92:  "The proclamation of Bara'ah marked the formal, permanent end of polytheism's presence in the Haram — a milestone showing the Prophetic mission had achieved one of its most fundamental objectives.",
  93:  "A study of the Prophet's ﷺ military ethics shows an approach to warfare — protecting civilians, prohibiting mutilation — centuries ahead of its time.",
  94:  "The mass embrace of Islam after Makkah's conquest shows that for many Arabs, the Prophet ﷺ had simply been waiting for proof that his message would prevail. Makkah's fall was that proof.",
  95:  "The Year of Delegations is the Seerah's broadest demonstration of Islam's universal appeal — people from across Arabia, with vastly different backgrounds, all drawn to the same man and message.",
  96:  "Reflecting on the impact of the Prophetic mission is not nostalgia — it is a necessary exercise in understanding what was accomplished and what the mission entrusted to the Ummah that followed.",
  97:  "The Farewell Pilgrimage and Sermon are the Prophet's ﷺ final public address to humanity — a declaration of Islam's completion and a charge to every Muslim who would come after.",
  98:  "The Expedition of Usamah — insisted upon by a dying Prophet ﷺ — shows that his concern for the Ummah's future never diminished. Even at the end, he was thinking about the next generation.",
  99:  "The final days of the Prophet ﷺ — his illness, his farewells, his death in Aisha's رضي الله عنها arms — are among the most sacred moments in Islamic history. Every detail carries meaning.",
  100: "The portrait of the Prophet's ﷺ household closes the Seerah with the human reality of who he left behind and what they carried forward into the world.",
};

export function getTimelineForPart(partNumber: number): TimelineEntry | null {
  const partIndex = PARTS.findIndex((p) => p.partNumber === partNumber);
  if (partIndex === -1) return null;

  const part = PARTS[partIndex];
  const prevPart = partIndex > 0 ? PARTS[partIndex - 1] : null;
  const nextPart = partIndex < PARTS.length - 1 ? PARTS[partIndex + 1] : null;
  const eraInfo = ERA_MAP[part.era as keyof typeof ERA_MAP];

  return {
    partNumber: part.partNumber,
    title: part.title,
    subtitle: part.subtitle ?? "",
    era: part.era,
    eraLabel: eraInfo?.label ?? part.era,
    eraColor: eraInfo?.color ?? "#C8A96E",
    description: part.description,
    previousEventTitle: prevPart?.title ?? null,
    previousEventSubtitle: prevPart?.subtitle ?? null,
    previousEventSummary: prevPart?.description ?? null,
    currentEventTitle: part.title,
    currentEventSubtitle: part.subtitle ?? "",
    currentEventSummary: part.description,
    nextEventTitle: nextPart?.title ?? null,
    nextEventSubtitle: nextPart?.subtitle ?? null,
    nextEventSummary: nextPart?.description ?? null,
    whyItMatters:
      WHY_IT_MATTERS[partNumber] ??
      `This is Part ${partNumber} of the 100-part Seerah journey.`,
    fullTimelinePosition: `Part ${partNumber} of 100`,
    lessonHref: `/seerah/part-${partNumber}`,
    nextLessonHref: nextPart ? `/seerah/part-${nextPart.partNumber}` : null,
    prevLessonHref: prevPart ? `/seerah/part-${prevPart.partNumber}` : null,
  };
}
