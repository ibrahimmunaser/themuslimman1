/**
 * Module-level cache for /api/part/N/assets responses.
 *
 * All callers (PartTabs + every lazy loader) call fetchPartAssets(N, lang).
 * If a request for part N + lang is already in-flight, they all share the same Promise —
 * no duplicate network requests regardless of mount order.
 * Results are cached for the lifetime of the page session.
 */

export interface PartAssets {
  videoUrl?: string;
  audioUrl?: string;
  mindmapUrl?: string;
  thumbnailUrl?: string;
}

const cache = new Map<string, Promise<PartAssets>>();

export function fetchPartAssets(partNumber: number, lang: "en" | "ar" = "en"): Promise<PartAssets> {
  const key = `${partNumber}-${lang}`;
  if (cache.has(key)) return cache.get(key)!;

  const url = lang === "ar"
    ? `/api/part/${partNumber}/assets?lang=ar`
    : `/api/part/${partNumber}/assets`;

  const promise = fetch(url)
    .then((r) => (r.ok ? r.json() : {}))
    .then((data: Partial<PartAssets>): PartAssets => ({
      videoUrl:    data.videoUrl,
      audioUrl:    data.audioUrl,
      mindmapUrl:  data.mindmapUrl,
      thumbnailUrl: data.thumbnailUrl,
    }))
    .catch((): PartAssets => ({}));

  cache.set(key, promise);
  return promise;
}

/** Clear the cache for a specific part+lang (e.g. after a language switch). */
export function clearPartAssetsCache(partNumber?: number): void {
  if (partNumber === undefined) {
    cache.clear();
  } else {
    cache.delete(`${partNumber}-en`);
    cache.delete(`${partNumber}-ar`);
  }
}
