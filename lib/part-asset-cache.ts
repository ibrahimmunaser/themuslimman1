/**
 * Module-level cache for /api/part/N/assets responses.
 *
 * All callers (PartTabs + every lazy loader) call fetchPartAssets(N).
 * If a request for part N is already in-flight, they all share the same Promise —
 * no duplicate network requests regardless of mount order.
 * Results are cached for the lifetime of the page session.
 */

export interface PartAssets {
  videoUrl?: string;
  audioUrl?: string;
  mindmapUrl?: string;
}

const cache = new Map<number, Promise<PartAssets>>();

export function fetchPartAssets(partNumber: number): Promise<PartAssets> {
  if (cache.has(partNumber)) return cache.get(partNumber)!;

  const promise = fetch(`/api/part/${partNumber}/assets`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((data): PartAssets => ({
      videoUrl:   data.videoUrl,
      audioUrl:   data.audioUrl,
      mindmapUrl: data.mindmapUrl,
    }))
    .catch((): PartAssets => ({}));

  cache.set(partNumber, promise);
  return promise;
}
