/**
 * Pre-generate WebP thumbnails for all slides in R2.
 *
 * Reads raw PNG slides (can be 30-54 MB each) and uploads two optimized
 * versions per slide:
 *   - <key-without-ext>-thumb.webp   (200 px wide, quality 75) — used in the strip
 *   - <key-without-ext>-medium.webp  (1280 px wide, quality 82) — used for the main viewer
 *
 * Run once (or whenever slides are updated):
 *   node scripts/generate-slide-thumbnails.js
 *
 * Flags:
 *   --part=1        Only process a single part number
 *   --type=presented  Only process one slide type (presented|detailed|facts)
 *   --skip-existing  Skip slides that already have a -thumb.webp in R2
 */
"use strict";

const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const sharp = require("sharp");
require("dotenv").config({ path: ".env" });

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET;
const PREFIXES = ["slides-presented/", "slides-detailed/", "slides-facts/"];

// Parse CLI flags
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

async function keyExists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function download(key) {
  const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function upload(key, buf) {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buf,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

async function listSlides(prefix) {
  const keys = [];
  let token;
  do {
    const res = await r2.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      })
    );
    for (const item of res.Contents ?? []) {
      if (item.Key.endsWith(".png")) keys.push(item.Key);
    }
    token = res.NextContinuationToken;
  } while (token);
  return keys;
}

async function processSlide(key) {
  const base = key.replace(/\.png$/i, "");
  const thumbKey = `${base}-thumb.webp`;
  const medKey = `${base}-medium.webp`;

  if (args["skip-existing"] && (await keyExists(thumbKey))) {
    process.stdout.write(`  skip ${key}\n`);
    return { skipped: true };
  }

  const sizeMB = "?";
  process.stdout.write(`  → ${key} (downloading…)`);
  const buf = await download(key);
  const mb = (buf.length / 1024 / 1024).toFixed(1);
  process.stdout.write(` ${mb} MB\n`);

  // 200 px thumb for thumbnail strip
  const thumbBuf = await sharp(buf)
    .resize(200, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72, effort: 4 })
    .toBuffer();

  // 1280 px medium for main viewer
  const medBuf = await sharp(buf)
    .resize(1280, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  const thumbKB = (thumbBuf.length / 1024).toFixed(0);
  const medKB = (medBuf.length / 1024).toFixed(0);

  await upload(thumbKey, thumbBuf);
  await upload(medKey, medBuf);

  console.log(
    `     thumb ${thumbKB} KB  medium ${medKB} KB  (was ${mb} MB, ${Math.round(
      ((buf.length - medBuf.length) / buf.length) * 100
    )}% smaller)`
  );

  return { srcMB: parseFloat(mb), thumbKB: thumbBuf.length, medKB: medBuf.length };
}

async function main() {
  console.log("🚀  Slide thumbnail generator\n");

  const prefixes = args.type
    ? [`slides-${args.type}/`]
    : PREFIXES;

  let totalSrcMB = 0;
  let totalOutKB = 0;
  let count = 0;
  let skipped = 0;
  let errors = 0;

  for (const prefix of prefixes) {
    console.log(`\n📂  ${prefix}`);
    const keys = await listSlides(prefix);

    // Optional: filter to a single part
    const filtered = args.part
      ? keys.filter((k) => {
          const partNum = parseInt(args.part, 10);
          const padded = String(partNum).padStart(2, "0");
          return (
            k.includes(`/Part ${padded}/`) ||
            k.includes(`/Part ${partNum} `) ||
            k.includes(`/Part ${partNum}/`)
          );
        })
      : keys;

    console.log(`   ${filtered.length} PNG slides`);

    for (const key of filtered) {
      try {
        const result = await processSlide(key);
        if (result.skipped) {
          skipped++;
        } else {
          count++;
          totalSrcMB += result.srcMB;
          totalOutKB += result.thumbKB + result.medKB;
        }
      } catch (err) {
        errors++;
        console.error(`  ❌ ${key}: ${err.message}`);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅  Done. Processed ${count} slides (${skipped} skipped, ${errors} errors)`);
  console.log(`   Total source: ${totalSrcMB.toFixed(1)} MB`);
  console.log(
    `   Total output: ${(totalOutKB / 1024).toFixed(1)} MB (thumb + medium)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
