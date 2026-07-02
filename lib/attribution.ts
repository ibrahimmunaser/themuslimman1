/**
 * First-touch attribution persistence for themuslimman.com.
 *
 * Captures UTM params, sponsor, creator, and referrer on the visitor's first
 * landing and stores them in localStorage. Subsequent page visits fill in any
 * empty slots but never overwrite existing values (first-touch wins).
 *
 * Survives: sponsor page → Part 1 → pricing → login → signup → checkout.
 */

export interface Attribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  sponsor: string | null;
  creator: string | null;
  referrer: string | null;
  initialLandingPage: string | null;
}

const STORAGE_KEY = "tmm_attribution";
const COOKIE_KEY  = "tmm_attr";       // compact first-party cookie fallback
const STORAGE_VERSION = 1;

interface StoredAttribution extends Attribution {
  _v: number;
  _ts: number;
}

const EMPTY: Attribution = {
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
  sponsor: null,
  creator: null,
  referrer: null,
  initialLandingPage: null,
};

function readFromStorage(): Attribution | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredAttribution;
      if (parsed._v === STORAGE_VERSION) return parsed;
    }
    // localStorage unavailable or stale — try cookie fallback
    const fromCookie = readFromCookie();
    if (fromCookie) return { ...EMPTY, ...fromCookie };
    return null;
  } catch {
    // localStorage blocked (private browsing, storage quota) — try cookie
    try {
      const fromCookie = readFromCookie();
      if (fromCookie) return { ...EMPTY, ...fromCookie };
    } catch { /* ignore */ }
    return null;
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────
// A compact first-party cookie stores key UTM values as a fallback for:
//   - Safari ITP (localStorage expires in 7 days for cross-site tracking)
//   - Private browsing (localStorage cleared on tab close)
//   - Accidental localStorage clear
// The cookie stores a URL-encoded JSON blob; max-age = 30 days.
// Cookie is SameSite=Lax, no Secure flag (works on HTTP localhost too).

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function readFromCookie(): Partial<Attribution> | null {
  try {
    if (typeof document === "undefined") return null;
    const match = document.cookie.split(";").map(s => s.trim()).find(s => s.startsWith(COOKIE_KEY + "="));
    if (!match) return null;
    const val = decodeURIComponent(match.slice(COOKIE_KEY.length + 1));
    return JSON.parse(val) as Partial<Attribution>;
  } catch { return null; }
}

function writeToCookie(attr: Attribution): void {
  try {
    if (typeof document === "undefined") return;
    // Only persist the most important attribution fields in the cookie to keep it small.
    const compact: Partial<Attribution> = {
      utmSource:          attr.utmSource,
      utmMedium:          attr.utmMedium,
      utmCampaign:        attr.utmCampaign,
      utmContent:         attr.utmContent,
      sponsor:            attr.sponsor,
      creator:            attr.creator,
      initialLandingPage: attr.initialLandingPage,
    };
    const val = encodeURIComponent(JSON.stringify(compact));
    document.cookie = `${COOKIE_KEY}=${val}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
  } catch { /* ignore */ }
}

function writeToStorage(attr: Attribution): void {
  try {
    if (typeof window === "undefined") return;
    const stored: StoredAttribution = { ...attr, _v: STORAGE_VERSION, _ts: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch { /* ignore storage errors */ }
  // Always mirror to cookie for fallback
  writeToCookie(attr);
}

/**
 * Returns the persisted attribution object.
 * Safe to call at any time — returns EMPTY when nothing is stored or on SSR.
 */
export function getAttribution(): Attribution {
  return readFromStorage() ?? { ...EMPTY };
}

/**
 * Reads the current URL and document.referrer, then persists first-touch values.
 * Call this once per page mount. Returns the merged attribution.
 */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return { ...EMPTY };

  const existing = readFromStorage();
  const params = new URLSearchParams(window.location.search);

  // "source" param is used on sponsor pages as a creator identifier
  const sourceParam = params.get("source") ?? params.get("creator");

  const fromUrl: Attribution = {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmContent: params.get("utm_content"),
    utmTerm: params.get("utm_term"),
    sponsor: params.get("sponsor") ?? sourceParam,
    creator: sourceParam,
    referrer: document.referrer || null,
    initialLandingPage: window.location.pathname,
  };

  if (!existing) {
    writeToStorage(fromUrl);
    return fromUrl;
  }

  // First-touch wins — fill in empty slots only
  const merged: Attribution = {
    utmSource: existing.utmSource || fromUrl.utmSource,
    utmMedium: existing.utmMedium || fromUrl.utmMedium,
    utmCampaign: existing.utmCampaign || fromUrl.utmCampaign,
    utmContent: existing.utmContent || fromUrl.utmContent,
    utmTerm: existing.utmTerm || fromUrl.utmTerm,
    sponsor: existing.sponsor || fromUrl.sponsor,
    creator: existing.creator || fromUrl.creator,
    referrer: existing.referrer || fromUrl.referrer,
    initialLandingPage: existing.initialLandingPage || fromUrl.initialLandingPage,
  };

  if (JSON.stringify(merged) !== JSON.stringify(existing)) {
    writeToStorage(merged);
  }
  return merged;
}

/**
 * Flattens Attribution into a plain object safe for event metadata.
 */
export function attributionToProps(
  attr: Attribution
): Record<string, string | null> {
  return {
    utm_source: attr.utmSource,
    utm_medium: attr.utmMedium,
    utm_campaign: attr.utmCampaign,
    utm_content: attr.utmContent,
    utm_term: attr.utmTerm,
    sponsor: attr.sponsor,
    creator_attribution: attr.creator,
    referrer: attr.referrer,
    initial_landing_page: attr.initialLandingPage,
  };
}

/**
 * Server-side: parse the tmm_attr cookie from a Cookie header string.
 * Use in server actions or API routes to read attribution without client JS.
 *
 * Priority: URL params → cookie → request Referer header
 *
 * @example
 *   const cookieHeader = request.headers.get("cookie") ?? "";
 *   const attr = getAttributionFromCookieHeader(cookieHeader);
 */
export function getAttributionFromCookieHeader(
  cookieHeader: string
): Partial<Attribution> {
  try {
    const match = cookieHeader.split(";").map(s => s.trim()).find(s => s.startsWith(COOKIE_KEY + "="));
    if (!match) return {};
    const val = decodeURIComponent(match.slice(COOKIE_KEY.length + 1));
    return JSON.parse(val) as Partial<Attribution>;
  } catch { return {}; }
}
