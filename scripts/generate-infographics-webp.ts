/**
 * Downloads infographic PNGs from R2, converts to WebP, and re-uploads.
 * Stores under the same key + ".webp" suffix:
 *   Infographics-Bento-Grid/Part 1.png  →  Infographics-Bento-Grid/Part 1.webp
 *   Infographics-Concise/Part 1 - Infographic.png  →  ...webp
 *   Infographics-Standard/Part 1 - Infographic.png →  ...webp
 *   mindmaps/Part 1 - Mindmap.png  →  mindmaps/Part 1 - Mindmap.webp
 *
 * Run all:    npx tsx scripts/generate-infographics-webp.ts
 * One part:   npx tsx scripts/generate-infographics-webp.ts 1
 * Force redo: npx tsx scripts/generate-infographics-webp.ts --force
 */

import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const R2_ACCOUNT_ID        = process.env.R2_ACCOUNT_ID!;
const R2_BUCKET            = process.env.R2_BUCKET!;
const R2_ACCESS_KEY_ID     = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;

if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY_ID) {
  console.error("Missing R2 env vars"); process.exit(1);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const WEBP_QUALITY  = 85;
const MAX_WIDTH     = 2400; // px — retina-safe for a 1200px modal

type AssetDef = { label: string; srcKey: (n: number) => string };

const ASSET_TYPES: AssetDef[] = [
  { label: "Bento Grid", srcKey: (n) => `Infographics-Bento-Grid/Part ${n}.png` },
  { label: "Concise",    srcKey: (n) => `Infographics-Concise/Part ${n} - Infographic.png` },
  { label: "Standard",   srcKey: (n) => `Infographics-Standard/Part ${n} - Infographic.png` },
  { label: "Mind Map",   srcKey: (n) => `mindmaps/Part ${n} - Mindmap.png` },
];

function destKey(src: string): string {
  return src.replace(/\.png$/i, ".webp");
}

async function exists(key: string): Promise<boolean> {
  try { await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key })); return true; }
  catch { return false; }
}

async function processOne(
  partNum: number,
  assetDef: AssetDef,
  force: boolean
): Promise<"ok" | "skip" | "error"> {
  const src  = assetDef.srcKey(partNum);
  const dest = destKey(src);

  if (!force && (await exists(dest))) {
    return "skip";
  }

  // Download source PNG
  let sourceBuffer: Buffer;
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: src }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    sourceBuffer = Buffer.concat(chunks);
  } catch {
    return "error";
  }

  // Convert to WebP
  const webpBuffer = await sharp(sourceBuffer)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();

  // Upload
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: dest,
    Body: webpBuffer,
    ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  }));

  const srcMb  = (sourceBuffer.byteLength  / 1024 / 1024).toFixed(1);
  const destKb = (webpBuffer.byteLength    / 1024).toFixed(0);
  const pct    = ((1 - webpBuffer.byteLength / sourceBuffer.byteLength) * 100).toFixed(0);
  console.log(
    `  Part ${String(partNum).padStart(3)}  ${assetDef.label.padEnd(12)}`
    + `  ${String(srcMb).padStart(5)} MB → ${String(destKb).padStart(5)} KB  (-${pct}%)`
  );
  return "ok";
}

(async () => {
  const argPart  = process.argv.find((a) => /^\d+$/.test(a));
  const force    = process.argv.includes("--force");
  const parts    = argPart
    ? [parseInt(argPart, 10)]
    : Array.from({ length: 100 }, (_, i) => i + 1);

  console.log("=".repeat(65));
  console.log(` WebP Infographic Generator — ${parts.length} part(s) × ${ASSET_TYPES.length} types`);
  console.log(` Quality: ${WEBP_QUALITY}  Max width: ${MAX_WIDTH}px  ${force ? "(force)" : "(skip existing)"}`);
  console.log("=".repeat(65));

  let ok = 0, skipped = 0, errors = 0;
  const startMs = Date.now();

  // Process parts in batches; each part processes its 4 asset types in parallel
  const BATCH = 3;
  for (let i = 0; i < parts.length; i += BATCH) {
    const batch = parts.slice(i, i + BATCH);
    await Promise.all(
      batch.flatMap((n) =>
        ASSET_TYPES.map(async (type) => {
          const result = await processOne(n, type, force);
          if (result === "ok")    ok++;
          else if (result === "skip")  skipped++;
          else                         errors++;
        })
      )
    );
  }

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  console.log("=".repeat(65));
  console.log(` Done in ${elapsed}s  |  Generated: ${ok}  Skipped: ${skipped}  Errors: ${errors}`);
  console.log("=".repeat(65));
})();
