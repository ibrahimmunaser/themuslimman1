import { S3Client, GetObjectCommand, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { FlashcardSet, Quiz } from "@/lib/types";

// ─── R2 Client Configuration ──────────────────────────────────────────────────

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.warn("⚠️  R2 credentials not configured. Some features may not work.");
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

// ─── Signed URL Expiry Constants ─────────────────────────────────────────────

/** 4 hours — long enough to stream an entire video/audio file without re-signing */
export const VIDEO_URL_EXPIRY = 4 * 60 * 60;

/** 2 hours — for images (infographics, mindmaps, slides) */
export const IMAGE_URL_EXPIRY = 2 * 60 * 60;

/** 10 minutes — general-purpose default */
export const DEFAULT_URL_EXPIRY = 10 * 60;

// ─── Signed URL Generation ────────────────────────────────────────────────────

/**
 * Generate a short-lived presigned URL for a private R2 object.
 *
 * The URL grants time-limited GET access directly from Cloudflare R2 — the
 * browser fetches the file from R2, NOT from Vercel. Presigning is a local
 * HMAC-SHA256 crypto operation; it does NOT make a network request to R2.
 *
 * @param key            - R2 object key (e.g. "videos/Part 5.mp4")
 * @param expiresInSeconds - How long the URL remains valid (default 10 min)
 */
export async function generateSignedR2Url(
  key: string,
  expiresInSeconds = DEFAULT_URL_EXPIRY
): Promise<string> {
  if (!R2_BUCKET) throw new Error("R2_BUCKET is not configured");

  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getSignedUrl(r2Client as any, command, { expiresIn: expiresInSeconds });
}

/**
 * Generate signed thumbnail URLs for a set of part numbers in parallel.
 * Returns a map of { [partNumber]: signedUrl }.
 * Parts whose thumbnail is missing or fails are silently omitted.
 *
 * Results are cached in memory for 1 hour (half the 2-hour URL expiry) so
 * repeated page loads don't re-sign the same 100 keys every time.
 */

// Cache: key → { url, expiresAt (ms epoch) }
const thumbnailCache = new Map<string, { url: string; expiresAt: number }>();
const THUMBNAIL_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function thumbnailKey(n: number): string {
  return `thumbnails/part-${String(n).padStart(2, "0")}-thumb.jpg`;
}

/**
 * Get the signed thumbnail URL for a single part number.
 * Reuses the shared thumbnail cache so concurrent callers share one signed URL.
 */
export async function getThumbnailUrl(partNumber: number): Promise<string | undefined> {
  const key = thumbnailKey(partNumber);
  const now = Date.now();
  const cached = thumbnailCache.get(key);
  if (cached && cached.expiresAt > now) return cached.url;
  try {
    const url = await generateSignedR2Url(key, IMAGE_URL_EXPIRY);
    thumbnailCache.set(key, { url, expiresAt: now + THUMBNAIL_CACHE_TTL_MS });
    return url;
  } catch {
    return undefined;
  }
}

export async function getThumbnailUrls(
  partNumbers: number[]
): Promise<Record<number, string>> {
  function firstSlideKey(n: number): string {
    return thumbnailKey(n);
  }

  const now = Date.now();

  const entries = await Promise.all(
    partNumbers.map(async (n) => {
      const key = firstSlideKey(n);
      const cached = thumbnailCache.get(key);
      if (cached && cached.expiresAt > now) {
        return [n, cached.url] as [number, string];
      }
      try {
        const url = await generateSignedR2Url(key, IMAGE_URL_EXPIRY);
        thumbnailCache.set(key, { url, expiresAt: now + THUMBNAIL_CACHE_TTL_MS });
        return [n, url] as [number, string];
      } catch {
        return null;
      }
    })
  );

  return Object.fromEntries(entries.filter((e): e is [number, string] => e !== null));
}

// ─── Public URL Generation ────────────────────────────────────────────────────


/**
 * Generate an asset URL (for API proxy route)
 * @param key - The object key in R2
 * @returns API route URL
 */
export function getR2AssetUrl(key: string): string {
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  return `/api/r2/asset?key=${encodeURIComponent(cleanKey)}`;
}

// ─── File Existence & Metadata ────────────────────────────────────────────────

/**
 * Check if a file exists in R2
 */
export async function r2FileExists(key: string): Promise<boolean> {
  if (!R2_BUCKET) return false;
  
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });
    await r2Client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file metadata from R2
 */
export async function r2GetMetadata(key: string) {
  if (!R2_BUCKET) return null;
  
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });
    const response = await r2Client.send(command);
    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || "application/octet-stream",
      lastModified: response.LastModified,
      etag: response.ETag,
    };
  } catch {
    return null;
  }
}

// ─── Streaming & Downloads ────────────────────────────────────────────────────

/**
 * Stream a file from R2 with range support
 */
export async function r2StreamFile(key: string, range?: string) {
  if (!R2_BUCKET) throw new Error("R2 not configured");
  
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Range: range,
  });
  
  return await r2Client.send(command);
}

// ─── Directory Listing ─────────────────────────────────────────────────────────

/**
 * List files in a folder/prefix
 * @param prefix - Folder path (e.g., "videos/", "mindmaps/")
 * @param maxKeys - Maximum number of files to return (default: 1000)
 */
export async function r2ListFiles(prefix: string, maxKeys = 1000) {
  if (!R2_BUCKET) return [];
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });
    
    const response = await r2Client.send(command);
    
    return (response.Contents || []).map((item) => ({
      key: item.Key || "",
      size: item.Size || 0,
      lastModified: item.LastModified,
      etag: item.ETag || "",
    }));
  } catch (error) {
    console.error("Error listing R2 files:", error);
    return [];
  }
}

/**
 * List all folders in R2 bucket
 */
export async function r2ListFolders() {
  if (!R2_BUCKET) return [];
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Delimiter: "/",
      MaxKeys: 100,
    });
    
    const response = await r2Client.send(command);
    
    return (response.CommonPrefixes || [])
      .map((prefix) => prefix.Prefix || "")
      .filter((p) => p.length > 0);
  } catch (error) {
    console.error("Error listing R2 folders:", error);
    return [];
  }
}

// ─── Asset Detection Helpers ───────────────────────────────────────────────────

/**
 * Get video filename for a part number
 */
export async function r2GetVideoKey(partNum: number): Promise<string | null> {
  const key = `videos/Part ${partNum}.mp4`;
  const exists = await r2FileExists(key);
  return exists ? key : null;
}

/**
 * Get audio filename for a part number
 */
export async function r2GetAudioKey(partNum: number): Promise<string | null> {
  // Candidate keys in priority order — checked in parallel to avoid 4× round-trips
  const candidates = [
    `audio/Part ${partNum}.mp3`,
    `audio/Part ${partNum} (1).mp3`,
    `audio/Part ${partNum} (1).wav`,
    `audio/Part ${partNum}.wav`,
  ];
  const results = await Promise.all(candidates.map((k) => r2FileExists(k)));
  return candidates.find((_, i) => results[i]) ?? null;
}

/**
 * Get mindmap image key — prefers WebP, falls back to PNG.
 */
export async function r2GetMindmapKey(partNum: number): Promise<string | null> {
  const webp = `mindmaps/Part ${partNum} - Mindmap.webp`;
  if (await r2FileExists(webp)) return webp;
  const png = `mindmaps/Part ${partNum} - Mindmap.png`;
  return (await r2FileExists(png)) ? png : null;
}

/**
 * Get infographic filename (checks multiple naming patterns)
 */
export async function r2GetInfographicKey(
  partNum: number,
  style: "Bento Grid" | "Concise" | "Standard"
): Promise<string | null> {
  // Map style names to actual R2 folder names (with hyphens)
  const folderMap: Record<string, string> = {
    "Bento Grid": "Infographics-Bento-Grid",
    "Concise": "Infographics-Concise",
    "Standard": "Infographics-Standard",
  };
  
  const prefix = `${folderMap[style]}/`;

  // Prefer WebP — check the two standard WebP key patterns first
  const simpleWebp = `${prefix}Part ${partNum}.webp`;
  if (await r2FileExists(simpleWebp)) return simpleWebp;
  const suffixWebp = `${prefix}Part ${partNum} - Infographic.webp`;
  if (await r2FileExists(suffixWebp)) return suffixWebp;

  // WebP not found — fall back to PNG
  const simpleKey = `${prefix}Part ${partNum}.png`;
  if (await r2FileExists(simpleKey)) return simpleKey;
  
  // List files in the folder to find alternate naming
  const files = await r2ListFiles(prefix);
  
  // Try to find with " - Infographic" suffix
  const withSuffix = files.find((f) => 
    f.key === `${prefix}Part ${partNum} - Infographic.png`
  );
  if (withSuffix) return withSuffix.key;
  
  // Fallback: find any file matching "Part X" (but not "Part XY")
  const looseRe = new RegExp(`^${prefix.replace(/\//g, "\\/")}Part ${partNum}[^0-9]`);
  const looseMatch = files.find((f) => 
    f.key.endsWith(".png") && looseRe.test(f.key)
  );
  
  return looseMatch?.key || null;
}

/**
 * Get slide files for a part
 */
export async function r2GetSlideKeys(
  partNum: number,
  type: "presented" | "detailed" | "facts"
): Promise<string[]> {
  let prefix: string;
  
  if (type === "presented") {
    const padded = partNum < 10 ? `0${partNum}` : `${partNum}`;
    prefix = `slides-presented/Part ${padded}/`;
  } else if (type === "detailed") {
    prefix = `slides-detailed/Part ${partNum} Watermark/`;
  } else {
    prefix = `slides-facts/Part ${partNum}/`;
  }
  
  const files = await r2ListFiles(prefix);
  return files
    .filter((f) => f.key.endsWith(".png"))
    .map((f) => f.key)
    .sort();
}


// ─── Text Files (Briefings, Reports, etc.) ─────────────────────────────────────

/**
 * Read a text file from R2
 */
export async function r2ReadTextFile(key: string): Promise<string | null> {
  if (!R2_BUCKET) return null;
  
  try {
    const response = await r2StreamFile(key);
    if (!response.Body) return null;
    
    const bodyString = await response.Body.transformToString("utf-8");
    return bodyString;
  } catch {
    return null;
  }
}

/**
 * Read JSON file from R2
 */
export async function r2ReadJsonFile<T = unknown>(key: string): Promise<T | null> {
  const content = await r2ReadTextFile(key);
  if (!content) return null;
  
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Read briefing document — prefers .md (structured markdown), falls back to .txt
 */
export async function r2ReadBriefing(partNum: number): Promise<string | null> {
  const md = await r2ReadTextFile(`briefing/Part ${partNum} Briefing Document.md`);
  if (md) return md;
  return await r2ReadTextFile(`briefing/Part ${partNum} Briefing Document.txt`);
}

/**
 * Read statement of facts — prefers .md, falls back to .txt
 */
export async function r2ReadStatementOfFacts(partNum: number): Promise<string | null> {
  const md = await r2ReadTextFile(`statement-of-facts/Part ${partNum} - Statement of Facts.md`);
  if (md) return md;
  return await r2ReadTextFile(`statement-of-facts/Part ${partNum} - Statement of Facts.txt`);
}

/**
 * Read study guide — prefers .md, falls back to .txt
 */
export async function r2ReadStudyGuide(partNum: number): Promise<string | null> {
  const md = await r2ReadTextFile(`studyguides/Part ${partNum} - Study Guide.md`);
  if (md) return md;
  return await r2ReadTextFile(`studyguides/Part ${partNum} - Study Guide.txt`);
}

/**
 * Read report — prefers .md, falls back to .txt
 */
export async function r2ReadReport(partNum: number): Promise<string | null> {
  const files = await r2ListFiles("reports/");
  const prefix = `reports/Part ${partNum} - Report`;

  // Prefer .md over .txt
  const mdMatch = files.find((f) => f.key.startsWith(prefix) && f.key.endsWith(".md"));
  if (mdMatch) return await r2ReadTextFile(mdMatch.key);

  const txtMatch = files.find((f) => f.key.startsWith(prefix) && f.key.endsWith(".txt"));
  if (!txtMatch) return null;
  return await r2ReadTextFile(txtMatch.key);
}

/**
 * Read flashcards
 */
export async function r2ReadFlashcards(partNum: number) {
  const pad = partNum < 10 ? `0${partNum}` : `${partNum}`;
  return await r2ReadJsonFile<FlashcardSet>(`flashcards/Part_${pad}.json`);
}

/**
 * Read quiz
 */
export async function r2ReadQuiz(partNum: number) {
  const pad = partNum < 10 ? `0${partNum}` : `${partNum}`;
  return await r2ReadJsonFile<Quiz>(`quizzes/Part_${pad}.json`);
}

// ─── Cache Utilities ───────────────────────────────────────────────────────────

/**
 * Generate ETag for cache validation
 */
export function generateETag(metadata: { size: number; lastModified?: Date }): string {
  const timestamp = metadata.lastModified?.getTime() || Date.now();
  return `"${timestamp}-${metadata.size}"`;
}

/**
 * Check if client has cached version
 */
export function isCached(etag: string, clientETag?: string | null): boolean {
  if (!clientETag) return false;
  return etag === clientETag;
}
