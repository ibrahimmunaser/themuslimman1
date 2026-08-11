/**
 * Server-side in-memory cache for part page data.
 *
 * All R2 operations (ListObjects, HeadObject, GetObject, signed URL generation)
 * are expensive on each page load. This cache ensures each part is loaded from R2
 * only once per cache TTL, then served instantly from memory.
 *
 * TTL: 90 minutes — safely within the 2-hour signed URL expiry window.
 *
 * Cache key: "${partNumber}-${lang}" — EN and AR are cached independently so a
 * language switch does not evict the other language's warm data.
 */

import {
  readBriefing,
  readStatementOfFacts,
  readStudyGuide,
  readReport,
  getSlideFiles,
  getInfographicFilename,
  mindmapExists,
  readQuiz,
  readFlashcards,
} from "@/lib/files";
import type { SlideFile } from "@/lib/types";
import {
  generateSignedR2Url,
  getThumbnailUrl,
  IMAGE_URL_EXPIRY,
  VIDEO_URL_EXPIRY,
  r2GetVideoKey,
  r2GetAudioKey,
  r2GetMindmapKey,
  r2GetArabicVideoKey,
  r2GetArabicAudioKey,
} from "@/lib/r2";
import type { CourseLang } from "@/lib/course-lang";

const TTL_MS = 90 * 60 * 1000; // 90 minutes

// Use globalThis so the cache is shared across all route contexts in the same
// Node.js process. In Next.js dev mode (Turbopack), API routes and page routes
// load separate module instances, so module-level Maps are not shared between
// them. globalThis is a single object per process and survives across imports.
declare global {
  var __partCache: Map<string, CachedPartData> | undefined;
  var __partInflight: Map<string, Promise<CachedPartData>> | undefined;
}

interface CachedPartData {
  briefingText: string | null;
  statementOfFactsText: string | null;
  studyGuideText: string | null;
  reportText: string | null;
  quizData: unknown;
  flashcards: unknown;
  slidesPresentedFiles: SlideFile[];
  slidesDetailedFiles: SlideFile[];
  slidesFactsFiles: SlideFile[];
  infConcise: string | null;
  infStandard: string | null;
  infBento: string | null;
  hasMindmap: boolean;
  infSignedConcise: string | undefined;
  infSignedStandard: string | undefined;
  infSignedBento: string | undefined;
  // Video/audio/mindmap signed URLs — passed to client to skip /api/part/N/assets call
  videoUrl: string | undefined;
  audioUrl: string | undefined;
  mindmapUrl: string | undefined;
  // Thumbnail URL — used as video poster so the browser doesn't load a full slide image
  thumbnailUrl: string | undefined;
  cachedAt: number;
}

const cache: Map<string, CachedPartData> =
  (globalThis.__partCache ??= new Map<string, CachedPartData>());
// Track in-flight fetches so concurrent requests for the same part+lang share one Promise
const inflight: Map<string, Promise<CachedPartData>> =
  (globalThis.__partInflight ??= new Map<string, Promise<CachedPartData>>());

async function loadPartData(n: number, lang: CourseLang): Promise<CachedPartData> {
  const signImg = (key: string | null, localFolder: string) =>
    key
      ? key.includes("/")
        ? generateSignedR2Url(key, IMAGE_URL_EXPIRY)
        : Promise.resolve(`/seerah-media/Infographics/${localFolder}/${key}`)
      : Promise.resolve(undefined);

  if (lang === "ar") {
    // Arabic: deterministic video/audio keys, single infographic, no detailed/facts slides.
    const [
      briefingText,
      statementOfFactsText,
      studyGuideText,
      quizData,
      flashcards,
      slidesPresentedFiles,
      infArKey,
      mindmapKey,
    ] = await Promise.all([
      readBriefing(n, "ar").catch(() => null),
      readStatementOfFacts(n, "ar").catch(() => null),
      readStudyGuide(n, "ar").catch(() => null),
      readQuiz(n, "ar").catch(() => null),
      readFlashcards(n, "ar").catch(() => null),
      getSlideFiles(n, "presented", "ar").catch(() => []),
      getInfographicFilename(n, "Concise", "ar").catch(() => null),
      // Mindmaps stay English; still sign so the Mindmap tab works in AR mode
      r2GetMindmapKey(n).catch(() => null),
    ]);

    const videoKey = r2GetArabicVideoKey(n);
    const audioKey = r2GetArabicAudioKey(n);

    const [infSignedConcise, videoUrl, audioUrl, mindmapUrl, thumbnailUrl] = await Promise.all([
      signImg(infArKey, "Concise"),
      generateSignedR2Url(videoKey, VIDEO_URL_EXPIRY).catch(() => undefined),
      generateSignedR2Url(audioKey, VIDEO_URL_EXPIRY).catch(() => undefined),
      mindmapKey ? generateSignedR2Url(mindmapKey, IMAGE_URL_EXPIRY) : Promise.resolve(undefined),
      getThumbnailUrl(n, "ar").catch(() => undefined),
    ]);

    return {
      briefingText,
      statementOfFactsText,
      studyGuideText,
      reportText: null,
      quizData,
      flashcards,
      slidesPresentedFiles,
      slidesDetailedFiles: [],
      slidesFactsFiles: [],
      infConcise: infArKey,
      infStandard: null,
      infBento: null,
      hasMindmap: !!mindmapKey,
      infSignedConcise,
      infSignedStandard: undefined,
      infSignedBento: undefined,
      videoUrl,
      audioUrl,
      mindmapUrl,
      thumbnailUrl,
      cachedAt: Date.now(),
    };
  }

  // ── English (existing logic) ──────────────────────────────────────────────────

  // Run all independent R2 operations in one flat Promise.all.
  const [
    briefingText,
    statementOfFactsText,
    studyGuideText,
    reportText,
    quizData,
    flashcards,
    slidesPresentedFiles,
    slidesDetailedFiles,
    slidesFactsFiles,
    infConcise,
    infStandard,
    infBento,
    hasMindmap,
    videoKey,
    audioKey,
    mindmapKey,
  ] = await Promise.all([
    // Batch A — content reads
    readBriefing(n).catch(() => null),
    readStatementOfFacts(n).catch(() => null),
    readStudyGuide(n).catch(() => null),
    readReport(n).catch(() => null),
    readQuiz(n).catch(() => null),
    readFlashcards(n).catch(() => null),
    getSlideFiles(n, "presented").catch(() => []),
    getSlideFiles(n, "detailed").catch(() => []),
    getSlideFiles(n, "facts").catch(() => []),
    getInfographicFilename(n, "Concise").catch(() => null),
    getInfographicFilename(n, "Standard").catch(() => null),
    getInfographicFilename(n, "Bento Grid").catch(() => null),
    mindmapExists(n).catch(() => false),
    // Batch B — media key lookups (independent of Batch A)
    r2GetVideoKey(n).catch(() => null),
    r2GetAudioKey(n).catch(() => null),
    r2GetMindmapKey(n).catch(() => null),
  ]);

  // Batch C — URL signing (depends on Batch A infographic keys + Batch B media keys)
  const [infSignedConcise, infSignedStandard, infSignedBento, videoUrl, audioUrl, mindmapUrl, thumbnailUrl] =
    await Promise.all([
      signImg(infConcise, "Concise"),
      signImg(infStandard, "Standard"),
      signImg(infBento, "Bento Grid"),
      videoKey   ? generateSignedR2Url(videoKey,   VIDEO_URL_EXPIRY) : Promise.resolve(undefined),
      audioKey   ? generateSignedR2Url(audioKey,   VIDEO_URL_EXPIRY) : Promise.resolve(undefined),
      mindmapKey ? generateSignedR2Url(mindmapKey, IMAGE_URL_EXPIRY) : Promise.resolve(undefined),
      // Thumbnail — reuses the shared 1-hour thumbnail cache; pure HMAC if cold.
      getThumbnailUrl(n).catch(() => undefined),
    ]);

  return {
    briefingText,
    statementOfFactsText,
    studyGuideText,
    reportText,
    quizData,
    flashcards,
    slidesPresentedFiles,
    slidesDetailedFiles,
    slidesFactsFiles,
    infConcise,
    infStandard,
    infBento,
    hasMindmap,
    infSignedConcise,
    infSignedStandard,
    infSignedBento,
    videoUrl,
    audioUrl,
    mindmapUrl,
    thumbnailUrl,
    cachedAt: Date.now(),
  };
}

/** Remove a specific part+lang from the cache so the next request re-fetches from R2. */
export function invalidatePartCache(n: number, lang: CourseLang = "en"): void {
  const key = `${n}-${lang}`;
  cache.delete(key);
  inflight.delete(key);
}

export async function getPartPageData(n: number, lang: CourseLang = "en"): Promise<CachedPartData> {
  const key = `${n}-${lang}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.cachedAt < TTL_MS) return cached;

  // Deduplicate concurrent requests for the same part+lang
  if (inflight.has(key)) return inflight.get(key)!;

  const promise = loadPartData(n, lang).then((data) => {
    cache.set(key, data);
    inflight.delete(key);
    return data;
  }).catch((err) => {
    inflight.delete(key);
    throw err;
  });

  inflight.set(key, promise);
  return promise;
}
