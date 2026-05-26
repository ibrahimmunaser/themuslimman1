/**
 * Generates compressed JPEG thumbnails from the first slide of each part
 * and uploads them to R2 under the `thumbnails/` prefix.
 *
 * Run: npx tsx scripts/generate-thumbnails.ts
 * Or for a single part: npx tsx scripts/generate-thumbnails.ts 1
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
const ENDPOINT             = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY_ID) {
  console.error("Missing R2 env vars");
  process.exit(1);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const TOTAL_PARTS = 100;
const THUMB_WIDTH = 640;   // px — enough for card display, ~4x smaller than typical HD
const THUMB_QUALITY = 82;  // JPEG quality

function sourceKey(n: number): string {
  const p = String(n).padStart(2, "0");
  return `slides-presented/Part ${p}/Part_${p}_Slide_001_watermarked.png`;
}

export function thumbKey(n: number): string {
  const p = String(n).padStart(2, "0");
  return `thumbnails/part-${p}-thumb.jpg`;
}

async function exists(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function generateOne(n: number, force = false): Promise<"ok" | "skip" | "error"> {
  const dest = thumbKey(n);

  if (!force && (await exists(dest))) {
    process.stdout.write(`  Part ${String(n).padStart(3)}  → already exists, skipping\n`);
    return "skip";
  }

  const src = sourceKey(n);

  // Download the source PNG from R2
  let sourceBuffer: Buffer;
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: src }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    sourceBuffer = Buffer.concat(chunks);
  } catch (err: any) {
    process.stdout.write(`  Part ${String(n).padStart(3)}  ✗ Source missing (${err?.message})\n`);
    return "error";
  }

  // Resize to JPEG thumbnail
  const thumb = await sharp(sourceBuffer)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
    .toBuffer();

  // Upload back to R2
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: dest,
    Body: thumb,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=31536000, immutable",
  }));

  const srcKb  = (sourceBuffer.byteLength / 1024).toFixed(0);
  const destKb = (thumb.byteLength / 1024).toFixed(0);
  const ratio  = ((1 - thumb.byteLength / sourceBuffer.byteLength) * 100).toFixed(0);
  process.stdout.write(`  Part ${String(n).padStart(3)}  ${srcKb.padStart(8)} KB → ${destKb.padStart(5)} KB  (${ratio}% smaller)\n`);
  return "ok";
}

(async () => {
  const arg = process.argv[2];
  const parts: number[] = arg
    ? [parseInt(arg, 10)]
    : Array.from({ length: TOTAL_PARTS }, (_, i) => i + 1);

  const force = process.argv.includes("--force");

  console.log("=".repeat(65));
  console.log(` Thumbnail Generator  —  ${parts.length} part(s)  ${force ? "(force re-generate)" : "(skip existing)"}`);
  console.log(" Output: thumbnails/part-XX-thumb.jpg");
  console.log(" Size: 640px wide JPEG @ q82 (mozjpeg)");
  console.log("=".repeat(65));

  // Process in batches to avoid hammering R2
  const BATCH = 5;
  let ok = 0, skipped = 0, errors = 0;
  const startMs = Date.now();

  for (let i = 0; i < parts.length; i += BATCH) {
    const batch = parts.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((n) => generateOne(n, force)));
    ok      += results.filter((r) => r === "ok").length;
    skipped += results.filter((r) => r === "skip").length;
    errors  += results.filter((r) => r === "error").length;
  }

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  console.log("=".repeat(65));
  console.log(` Done in ${elapsed}s  |  Generated: ${ok}  Skipped: ${skipped}  Errors: ${errors}`);
  console.log("=".repeat(65));
})();
