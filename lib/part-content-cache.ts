/**
 * Server-side in-memory cache for part page data.
 *
 * All R2 operations (ListObjects, HeadObject, GetObject, signed URL generation)
 * are expensive on each page load. This cache ensures each part is loaded from R2
 * only once per cache TTL, then served instantly from memory.
 *
 * TTL: 90 minutes — safely within the 2-hour signed URL expiry window.
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
import {
  generateSignedR2Url,
  IMAGE_URL_EXPIRY,
  VIDEO_URL_EXPIRY,
  r2GetVideoKey,
  r2GetAudioKey,
  r2GetMindmapKey,
} from "@/lib/r2";

const TTL_MS = 90 * 60 * 1000; // 90 minutes

interface CachedPartData {
  briefingText: string | null;
  statementOfFactsText: string | null;
  studyGuideText: string | null;
  reportText: string | null;
  quizData: unknown;
  flashcards: unknown;
  slidesPresentedFiles: string[];
  slidesDetailedFiles: string[];
  slidesFactsFiles: string[];
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
  cachedAt: number;
}

const cache = new Map<number, CachedPartData>();
// Track in-flight fetches so concurrent requests for the same part share one Promise
const inflight = new Map<number, Promise<CachedPartData>>();

async function loadPartData(n: number): Promise<CachedPartData> {
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
  ] = await Promise.all([
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
  ]);

  const signImg = (key: string | null, localFolder: string) =>
    key
      ? key.includes("/")
        ? generateSignedR2Url(key, IMAGE_URL_EXPIRY)
        : Promise.resolve(`/seerah-media/Infographics/${localFolder}/${key}`)
      : Promise.resolve(undefined);

  // Also resolve video/audio/mindmap keys and sign them server-side
  const [videoKey, audioKey, mindmapKey] = await Promise.all([
    r2GetVideoKey(n),
    r2GetAudioKey(n),
    r2GetMindmapKey(n),
  ]);

  const [infSignedConcise, infSignedStandard, infSignedBento, videoUrl, audioUrl, mindmapUrl] =
    await Promise.all([
      signImg(infConcise, "Concise"),
      signImg(infStandard, "Standard"),
      signImg(infBento, "Bento Grid"),
      videoKey   ? generateSignedR2Url(videoKey,   VIDEO_URL_EXPIRY) : Promise.resolve(undefined),
      audioKey   ? generateSignedR2Url(audioKey,   VIDEO_URL_EXPIRY) : Promise.resolve(undefined),
      mindmapKey ? generateSignedR2Url(mindmapKey, IMAGE_URL_EXPIRY) : Promise.resolve(undefined),
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
    cachedAt: Date.now(),
  };
}

export async function getPartPageData(n: number): Promise<CachedPartData> {
  const cached = cache.get(n);
  if (cached && Date.now() - cached.cachedAt < TTL_MS) return cached;

  // Deduplicate concurrent requests for the same part
  if (inflight.has(n)) return inflight.get(n)!;

  const promise = loadPartData(n).then((data) => {
    cache.set(n, data);
    inflight.delete(n);
    return data;
  }).catch((err) => {
    inflight.delete(n);
    throw err;
  });

  inflight.set(n, promise);
  return promise;
}
