/**
 * Generates compressed JPEG thumbnails from the first slide of each part
 * and uploads them to R2.
 *
 * Run English:  npx tsx scripts/generate-thumbnails.ts
 * Run Arabic:   npx tsx scripts/generate-thumbnails.ts --ar
 * One language: npx tsx scripts/generate-thumbnails.ts --lang hi
 * All translated decks (French + the 12 course languages):
 *               npx tsx scripts/generate-thumbnails.ts --all
 * Single part:  npx tsx scripts/generate-thumbnails.ts 1 --lang hi
 * Force regen:  npx tsx scripts/generate-thumbnails.ts --all --force
 */

import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import dotenv from "dotenv";
import { LOCALIZED_MEDIA, type CourseLang } from "../lib/course-lang";

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
const THUMB_WIDTH = 640;
const THUMB_QUALITY = 82;
const BATCH = 3;

const LOCALIZED_LANGS = Object.keys(LOCALIZED_MEDIA) as Exclude<CourseLang, "en" | "ar">[];

export function thumbPaths(lang: CourseLang, n: number): { src: string; dest: string } {
  const pad = String(n).padStart(2, "0");
  const p3 = String(n).padStart(3, "0");
  if (lang === "ar") {
    return {
      src: `arabic/slides/Part ${n}/part_${p3}_page_001.png`,
      dest: `arabic/thumbnails/part-${pad}-thumb.jpg`,
    };
  }
  if (lang === "en") {
    return {
      src: `slides-presented/Part ${pad}/Part_${pad}_Slide_001_watermarked.png`,
      dest: `thumbnails/part-${pad}-thumb.jpg`,
    };
  }
  const media = LOCALIZED_MEDIA[lang];
  return {
    src: `${media.folder}/${media.slides}/Part ${n}/part_${p3}_page_001_image_001_watermarked.png`,
    dest: `${media.folder}/thumbnails/part-${pad}-thumb.jpg`,
  };
}

function destPrefix(lang: CourseLang): string {
  if (lang === "ar") return "arabic/thumbnails";
  if (lang === "en") return "thumbnails";
  return `${LOCALIZED_MEDIA[lang].folder}/thumbnails`;
}

async function exists(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function generateOne(lang: CourseLang, n: number, force = false): Promise<"ok" | "skip" | "error"> {
  const { src, dest } = thumbPaths(lang, n);

  if (!force && (await exists(dest))) {
    process.stdout.write(`  ${lang} part ${String(n).padStart(3)}  → already exists, skipping\n`);
    return "skip";
  }

  let sourceBuffer: Buffer;
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: src }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    sourceBuffer = Buffer.concat(chunks);
  } catch (err: any) {
    process.stdout.write(`  ${lang} part ${String(n).padStart(3)}  ✗ Source missing (${src}) ${err?.message ?? ""}\n`);
    return "error";
  }

  const thumb = await sharp(sourceBuffer)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
    .toBuffer();

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
  process.stdout.write(`  ${lang} part ${String(n).padStart(3)}  ${srcKb.padStart(8)} KB → ${destKb.padStart(5)} KB  (${ratio}% smaller)\n`);
  return "ok";
}

function langsFromArgv(): CourseLang[] {
  if (process.argv.includes("--all")) return [...LOCALIZED_LANGS];
  const langFlag = process.argv.indexOf("--lang");
  if (langFlag !== -1) {
    const code = process.argv[langFlag + 1];
    if (!code || (code !== "en" && code !== "ar" && !(code in LOCALIZED_MEDIA))) {
      console.error(`Unknown language "${code}". Use en, ar, or one of: ${LOCALIZED_LANGS.join(", ")}`);
      process.exit(1);
    }
    return [code as CourseLang];
  }
  if (process.argv.includes("--ar")) return ["ar"];
  return ["en"];
}

(async () => {
  const arg = process.argv.find((a) => /^\d+$/.test(a));
  const parts: number[] = arg
    ? [parseInt(arg, 10)]
    : Array.from({ length: TOTAL_PARTS }, (_, i) => i + 1);

  const force = process.argv.includes("--force");
  const langs = langsFromArgv();

  console.log("=".repeat(65));
  console.log(` Thumbnail Generator  —  ${langs.join(", ")}  —  ${parts.length} part(s)  ${force ? "(force re-generate)" : "(skip existing)"}`);
  console.log(" Size: 640px wide JPEG @ q82 (mozjpeg)");
  console.log(" Source: first slide of each language's deck");
  console.log("=".repeat(65));

  let ok = 0, skipped = 0, errors = 0;
  const startMs = Date.now();

  for (const lang of langs) {
    console.log(`\n${lang}  →  ${destPrefix(lang)}/part-XX-thumb.jpg`);
    for (let i = 0; i < parts.length; i += BATCH) {
      const batch = parts.slice(i, i + BATCH);
      const results = await Promise.all(batch.map((n) => generateOne(lang, n, force)));
      ok      += results.filter((r) => r === "ok").length;
      skipped += results.filter((r) => r === "skip").length;
      errors  += results.filter((r) => r === "error").length;
    }
    console.log(`${lang} complete`);
  }

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  console.log("=".repeat(65));
  console.log(` Done in ${elapsed}s  |  Generated: ${ok}  Skipped: ${skipped}  Errors: ${errors}`);
  console.log("ALL DONE");
  console.log("=".repeat(65));
})();
