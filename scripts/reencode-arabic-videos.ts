/**
 * Re-encode Arabic course videos from 5K H.264 Level 6.0 → 1440p Level 5.1
 * (matching English masters) so browsers/devices reliably play audio+video.
 *
 * Usage:
 *   npx tsx scripts/reencode-arabic-videos.ts              # all 1–100
 *   npx tsx scripts/reencode-arabic-videos.ts --parts 1,8  # subset
 *   npx tsx scripts/reencode-arabic-videos.ts --dry-run    # probe only
 *   npx tsx scripts/reencode-arabic-videos.ts --keep-local # don't delete temp files
 *
 * Requires ffmpeg/ffprobe on PATH (or FFMPEG_PATH / FFPROBE_PATH).
 * Uploads replace arabic/videos/{nnn}_Part {n}_with_title.mp4 in R2.
 */
import { spawnSync } from "child_process";
import { createReadStream, existsSync, mkdirSync, unlinkSync, statSync } from "fs";
import { join } from "path";
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const ffmpeg =
  process.env.FFMPEG_PATH ||
  process.env.FFMPEG ||
  "ffmpeg";
const ffprobe =
  process.env.FFPROBE_PATH ||
  process.env.FFPROBE ||
  "ffprobe";

const accountId = process.env.R2_ACCOUNT_ID!;
const bucket = process.env.R2_BUCKET!;
const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

function videoKey(n: number) {
  return `arabic/videos/${pad3(n)}_Part ${n}_with_title.mp4`;
}

function parseParts(argv: string[]): number[] {
  const idx = argv.indexOf("--parts");
  if (idx >= 0 && argv[idx + 1]) {
    return argv[idx + 1]
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => n >= 1 && n <= 100);
  }
  return Array.from({ length: 100 }, (_, i) => i + 1);
}

function probeDims(urlOrPath: string): { width: number; height: number; level: number } | null {
  const r = spawnSync(
    ffprobe,
    [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height,level",
      "-of", "csv=p=0",
      urlOrPath,
    ],
    { encoding: "utf8", timeout: 120_000 },
  );
  const line = (r.stdout || "").trim();
  if (!line) return null;
  const [w, h, level] = line.split(",").map(Number);
  return { width: w, height: h, level };
}

async function downloadKey(key: string, dest: string) {
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 3600 },
  );
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`download failed ${res.status} ${key}`);
  await pipeline(Readable.fromWeb(res.body as any), createWriteStream(dest));
}

async function uploadFile(key: string, filePath: string) {
  const body = createReadStream(filePath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "video/mp4",
    }),
  );
}

function reencode(input: string, output: string) {
  // Match English delivery: 2560×1440 H.264 High @ L5.1 + AAC, moov at front.
  const args = [
    "-y",
    "-i", input,
    "-vf", "scale=2560:1440:force_original_aspect_ratio=decrease,pad=2560:1440:(ow-iw)/2:(oh-ih)/2",
    "-c:v", "libx264",
    "-profile:v", "high",
    "-level:v", "5.1",
    "-pix_fmt", "yuv420p",
    "-crf", "20",
    "-preset", "medium",
    "-c:a", "aac",
    "-b:a", "192k",
    "-ac", "2",
    "-ar", "48000",
    "-movflags", "+faststart",
    output,
  ];
  const r = spawnSync(ffmpeg, args, { encoding: "utf8", timeout: 0 });
  if (r.status !== 0) {
    throw new Error(`ffmpeg failed:\n${(r.stderr || "").slice(-2000)}`);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const keepLocal = argv.includes("--keep-local");
  const parts = parseParts(argv);
  const workDir = join(process.cwd(), ".tmp-ar-reencode");
  mkdirSync(workDir, { recursive: true });

  console.log(`Re-encode Arabic videos → 1440p L5.1 (${parts.length} parts)${dryRun ? " [dry-run]" : ""}`);

  for (const n of parts) {
    const key = videoKey(n);
    process.stdout.write(`Part ${n}: `);

    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      console.log("MISSING — skip");
      continue;
    }

    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 600 },
    );
    const dims = probeDims(url);
    if (!dims) {
      console.log("probe failed — skip");
      continue;
    }

    if (dims.height <= 1440 && dims.level <= 51) {
      console.log(`already web-safe (${dims.width}x${dims.height} L${dims.level}) — skip`);
      continue;
    }

    console.log(`${dims.width}x${dims.height} L${dims.level}`);
    if (dryRun) continue;

    const inPath = join(workDir, `part-${pad3(n)}-src.mp4`);
    const outPath = join(workDir, `part-${pad3(n)}-web.mp4`);

    console.log(`  downloading…`);
    await downloadKey(key, inPath);
    console.log(`  encoding…`);
    reencode(inPath, outPath);
    const outDims = probeDims(outPath);
    const sizeMb = (statSync(outPath).size / (1024 * 1024)).toFixed(1);
    console.log(`  upload ${sizeMb} MB (${outDims?.width}x${outDims?.height} L${outDims?.level})…`);
    await uploadFile(key, outPath);
    console.log(`  done`);

    if (!keepLocal) {
      try { unlinkSync(inPath); } catch { /* ignore */ }
      try { unlinkSync(outPath); } catch { /* ignore */ }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
