"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, MapPin, Info } from "lucide-react";

interface Place {
  name: string;
  type: string;
  region?: string;
  area?: string;
  connection: string;
  description: string;
  category: string;
  relatedEvent?: string;
}

interface Route {
  name: string;
  path: string;
  description: string;
}

// ── Places Data ────────────────────────────────────────────────────────────────

const MAJOR_CITIES: Place[] = [
  { name: "Makkah", type: "City", region: "Hijaz", connection: "Birthplace of the Prophet ﷺ and start of the early mission", description: "Makkah was the city where the Prophet ﷺ was born, where the early call to Islam began, and where Quraysh held power around the Ka'bah.", category: "Makkah" },
  { name: "Madinah", type: "City", region: "Hijaz", connection: "Hijrah and Islamic state", description: "Madinah, formerly known as Yathrib, became the home of the Muslims after the Hijrah and the center of the growing Muslim community.", category: "Madinah" },
  { name: "Ta'if", type: "City", region: "Near Makkah", connection: "Visit of da'wah and later Islam", description: "The Prophet ﷺ traveled to Ta'if seeking support after the Year of Sorrow and was rejected there, though the city later entered Islam.", category: "Arabia" },
  { name: "Khaybar", type: "Settlement / Oasis region", region: "North of Madinah", connection: "Major Madinan campaign", description: "Khaybar was a fortified region north of Madinah and the site of a major campaign in the Madinan period.", category: "Arabia" },
  { name: "Tabuk", type: "Region / expedition destination", region: "North Arabia", connection: "Expedition of Tabuk", description: "Tabuk marks the destination of one of the last major expeditions in the Prophet's ﷺ life.", category: "Arabia" },
  { name: "Abyssinia", type: "Kingdom / region", region: "Across the Red Sea", connection: "Early migration", description: "Abyssinia was the land to which some early Muslims migrated to escape persecution in Makkah.", category: "Outside Arabia" },
  { name: "Mu'tah", type: "Location", region: "Greater Syria area", connection: "Battle of Mu'tah", description: "Mu'tah was the site of a major battle involving the Muslims beyond Arabia.", category: "Outside Arabia" },
];

const MAKKAH_MADINAH_LOCATIONS: Place[] = [
  { name: "Ka'bah", type: "Sacred site", area: "Makkah", connection: "Center of worship", description: "The Ka'bah was the focal point of worship and central to the religious significance of Makkah.", category: "Makkah" },
  { name: "Cave of Hira", type: "Cave / mountain location", area: "Near Makkah", connection: "First revelation", description: "The first revelation came to the Prophet ﷺ in the Cave of Hira on Jabal al-Nur.", category: "Makkah" },
  { name: "Cave of Thawr", type: "Cave / mountain location", area: "Near Makkah", connection: "Hijrah", description: "The Prophet ﷺ and Abu Bakr رضي الله عنه sheltered in the Cave of Thawr during the Hijrah.", category: "Hijrah Route" },
  { name: "Mina", type: "Valley", area: "Near Makkah", connection: "Hajj and pledges", description: "Mina is connected to the rites of Hajj and to the pledges that helped prepare the way for the Hijrah.", category: "Hajj Locations" },
  { name: "Arafah", type: "Plain / sacred site", area: "Near Makkah", connection: "Hajj", description: "Arafah is one of the most important sites of Hajj and is associated with the Farewell Pilgrimage.", category: "Hajj Locations" },
  { name: "Muzdalifah", type: "Open plain", area: "Near Makkah", connection: "Hajj", description: "Muzdalifah is one of the key locations connected to the rites of Hajj.", category: "Hajj Locations" },
  { name: "Quba", type: "Area / mosque location", area: "Near Madinah", connection: "Arrival after Hijrah", description: "Quba was the first stopping place of the Prophet ﷺ upon arriving near Madinah and the site of Quba Mosque.", category: "Madinah" },
  { name: "Masjid al-Nabawi", type: "Mosque", area: "Madinah", connection: "Center of community", description: "Masjid al-Nabawi became the center of worship, leadership, teaching, and community life in Madinah.", category: "Madinah" },
  { name: "Jannat al-Baqi'", type: "Cemetery", area: "Madinah", connection: "Burial ground", description: "Al-Baqi' became the well-known burial place for many companions and family members.", category: "Madinah" },
  { name: "Masjid al-Qiblatayn", type: "Mosque", area: "Madinah", connection: "Qiblah change", description: "This location is associated with the change of the qiblah from Jerusalem to the Ka'bah.", category: "Madinah" },
  { name: "Mount Uhud", type: "Mountain", area: "Madinah", connection: "Battle of Uhud", description: "Mount Uhud is the site of the famous battle and one of the most important locations in the Madinan Seerah.", category: "Battles" },
  { name: "Trench / Khandaq area", type: "Battlefield zone", area: "Madinah", connection: "Battle of the Trench", description: "This area marks where the Muslims dug the trench to defend Madinah from the confederate siege.", category: "Battles" },
];

const BATTLES_EXPEDITIONS: Place[] = [
  { name: "Badr", type: "Battlefield / well area", connection: "Battle of Badr", description: "Badr was the site of the first major battle between the Muslims and Quraysh.", category: "Battles", relatedEvent: "Battle of Badr" },
  { name: "Uhud", type: "Battlefield", connection: "Battle of Uhud", description: "Uhud was the site of a major battle that taught lasting lessons about obedience and discipline.", category: "Battles", relatedEvent: "Battle of Uhud" },
  { name: "Khandaq", type: "Battlefield / defensive zone", connection: "Battle of the Trench", description: "The confederate forces were held off through the trench strategy around Madinah.", category: "Battles", relatedEvent: "Battle of the Trench" },
  { name: "Hudaybiyyah", type: "Outskirts / treaty site", connection: "Treaty of Hudaybiyyah", description: "Hudaybiyyah was the place where the treaty was concluded between the Muslims and Quraysh.", category: "Routes", relatedEvent: "Treaty of Hudaybiyyah" },
  { name: "Hunayn", type: "Valley", connection: "Battle of Hunayn", description: "Hunayn was the site of the battle that followed the conquest of Makkah.", category: "Battles", relatedEvent: "Battle of Hunayn" },
  { name: "Ta'if campaign area", type: "City / siege area", connection: "After Hunayn", description: "The Muslims moved toward Ta'if after Hunayn.", category: "Routes", relatedEvent: "Siege of Ta'if" },
  { name: "Khaybar", type: "Fortified oasis area", connection: "Khaybar campaign", description: "Khaybar was a significant northern campaign in the Madinan period.", category: "Battles", relatedEvent: "Khaybar campaign" },
  { name: "Mu'tah", type: "Battle location", connection: "Battle of Mu'tah", description: "Mu'tah was the site of a major expedition facing Byzantine-allied forces.", category: "Battles", relatedEvent: "Battle of Mu'tah" },
  { name: "Tabuk", type: "Expedition destination", connection: "Expedition of Tabuk", description: "Tabuk was one of the last major expedition destinations during the Prophet's ﷺ life.", category: "Routes", relatedEvent: "Expedition of Tabuk" },
  { name: "Ji'ranah", type: "Location", connection: "Return from Hunayn", description: "Ji'ranah is associated with events after Hunayn.", category: "Routes", relatedEvent: "After Hunayn" },
];

const ROUTES: Route[] = [
  { name: "Makkan Da'wah Zone", path: "Makkah → Cave of Hira → surrounding Quraysh environment", description: "The early phase of the mission centered around Makkah and its vicinity." },
  { name: "Hijrah Route", path: "Makkah → Cave of Thawr → route northward → Quba → Madinah", description: "The migration route that marked the turning point for the Muslim community." },
  { name: "Ta'if Journey", path: "Makkah → Ta'if → return to Makkah", description: "The Prophet's ﷺ journey seeking support after the Year of Sorrow." },
  { name: "Badr Route", path: "Madinah → Badr", description: "The route to the first major battle." },
  { name: "Hudaybiyyah Route", path: "Madinah → outskirts of Makkah → Hudaybiyyah", description: "The journey that led to the treaty between Muslims and Quraysh." },
  { name: "Khaybar Route", path: "Madinah → Khaybar", description: "The northern campaign route from Madinah." },
  { name: "Tabuk Route", path: "Madinah → Tabuk", description: "One of the longest expeditions during the Prophet's ﷺ life." },
  { name: "Abyssinia Migration", path: "Makkah → Red Sea crossing → Abyssinia", description: "The migration route for early Muslims escaping persecution." },
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

// ── Component ──────────────────────────────────────────────────────────────────

export function PlacesMapsContent() {
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
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.type.toLowerCase().includes(query) ||
          p.connection.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (p.relatedEvent && p.relatedEvent.toLowerCase().includes(query))
      );
    }

    return results;
  }, [searchQuery, selectedCategory, allPlaces]);

  const displayedPlaces = showAllPlaces ? filteredPlaces : filteredPlaces.slice(0, 12);

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
            Places and Maps
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            A reference to the key cities, routes, and locations mentioned in the Seerah.
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            The Seerah happened across real cities, valleys, mountains, battlefields, and travel
            routes. Understanding the places of the Seerah helps users follow the story more
            clearly and see how migration, trade, battle, da'wah, and worship all unfolded across
            Arabia and beyond.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Key places", value: `${allPlaces.length}+` },
            { label: "Major routes", value: `${ROUTES.length}` },
            { label: "Cities", value: `${MAJOR_CITIES.length}` },
            { label: "Battle sites", value: `${BATTLES_EXPEDITIONS.filter(p => p.category === "Battles").length}` },
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
            { title: "Why place matters in the Seerah", text: "The Seerah is easier to follow when users can locate where revelation, persecution, migration, battles, treaties, and worship took place." },
            { title: "Why Makkah matters", text: "Makkah is the birthplace of the Prophet ﷺ, the site of the Ka'bah, and the place where the mission began under Quraysh opposition." },
            { title: "Why Madinah matters", text: "Madinah is where the Muslims built a community, established social order, and moved from persecution to strength after the Hijrah." },
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search places, cities, or locations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-surface text-text placeholder-text-muted focus:outline-none focus:border-gold/40 transition-colors"
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
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Places Grid */}
        {filteredPlaces.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-secondary">No places found matching your search.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 text-sm text-text-muted">
              <MapPin className="w-4 h-4" />
              <span>Showing {displayedPlaces.length} of {filteredPlaces.length} places</span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {displayedPlaces.map((place, index) => (
                <PlaceCard key={index} place={place} />
              ))}
            </div>

            {/* Show more/less */}
            {filteredPlaces.length > 12 && (
              <div className="text-center mb-12">
                <button
                  onClick={() => setShowAllPlaces(!showAllPlaces)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface border border-border hover:border-gold/40 text-text-secondary hover:text-text font-medium text-sm transition-colors"
                >
                  {showAllPlaces ? "Show Less" : `Show All ${filteredPlaces.length} Places`}
                </button>
              </div>
            )}
          </>
        )}

        {/* Routes Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text mb-4">Major Routes</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {ROUTES.map((route, index) => (
              <div key={index} className="p-4 rounded-xl border border-border bg-surface">
                <h3 className="text-base font-bold text-gold mb-2">{route.name}</h3>
                <p className="text-xs text-text-muted mb-3 font-mono">{route.path}</p>
                <p className="text-xs text-text-secondary leading-relaxed">{route.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Map Placeholder */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text mb-4">Interactive Reference Map</h2>
          <div className="rounded-2xl border-2 border-border bg-surface p-8 text-center">
            <div className="max-w-md mx-auto">
              <MapPin className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-lg font-bold text-text mb-2">Interactive Map Coming Soon</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                We're building an interactive map that will let you explore all locations with
                clickable markers, route overlays, and detailed information for each place.
              </p>
              <div className="flex gap-3 p-4 rounded-xl border border-gold/20 bg-gold-bg/30 text-xs text-text-secondary">
                <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                <p className="text-left">
                  For now, use the search and filter above to explore all {allPlaces.length} locations
                  across Makkah, Madinah, battlefields, and key routes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="text-sm text-text-muted mb-1">Ready to go deeper?</p>
              <p className="text-base font-semibold text-text">
                See these places come to life in the full 100-part Seerah course.
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

// ── Place Card Component ───────────────────────────────────────────────────────

function PlaceCard({ place }: { place: Place }) {
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

  return (
    <div className="p-4 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-text">{place.name}</h3>
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${badgeColor}`}>
          {place.category}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-gold">{place.type}</p>
        {(place.region || place.area) && (
          <p className="text-xs text-text-muted">{place.region || place.area}</p>
        )}
      </div>
      <p className="text-xs text-text-muted italic">{place.connection}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{place.description}</p>
      {place.relatedEvent && (
        <p className="text-xs font-medium text-gold/70">→ {place.relatedEvent}</p>
      )}
    </div>
  );
}
