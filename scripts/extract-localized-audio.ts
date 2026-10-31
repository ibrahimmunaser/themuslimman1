/**
 * Extract a standalone mp3 from each dubbed video and upload it to R2.
 *
 *   npx tsx scripts/extract-localized-audio.ts
 *   npx tsx scripts/extract-localized-audio.ts --langs fr,es --parts 1,2
 *
 * Skips an mp3 that is already in the bucket, so it is safe to re-run.
 * Output keys: {folder}/audio/Part {n}.mp3
 * Source keys: {folder}/videos/Final_Part_{n}_Full.mp4
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

import { spawn } from "child_process";
import { createReadStream, existsSync, mkdirSync, statSync, unlinkSync, appendFileSync } from "fs";
import { join } from "path";
import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { LOCALIZED_MEDIA } from "../lib/course-lang";

function bin(envVal: string | undefined, name: string): string {
  if (!envVal) return name;
  const lower = envVal.toLowerCase();
  if (lower.endsWith(".exe") || lower.endsWith(name)) return envVal;
  return join(envVal, process.platform === "win32" ? `${name}.exe` : name);
}

const ffmpeg = bin(process.env.FFMPEG_PATH || process.env.FFMPEG, "ffmpeg");
const bucket = process.env.R2_BUCKET!;
const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const outDir = join(process.cwd(), "tmp", "loc-audio");
const logPath = join(process.cwd(), "tmp", "loc-audio-log.txt");
const CONCURRENCY = 3;

type Job = { code: string; folder: string; part: number };

function argList(flag: string): string[] | null {
  const i = process.argv.indexOf(flag);
  if (i < 0 || !process.argv[i + 1]) return null;
  return process.argv[i + 1].split(",").map((s) => s.trim()).filter(Boolean);
}

function jobs(): Job[] {
  const langFilter = argList("--langs");
  const partFilter = argList("--parts")?.map((s) => parseInt(s, 10));
  const parts = partFilter ?? Array.from({ length: 100 }, (_, i) => i + 1);
  const list: Job[] = [];
  for (const [code, media] of Object.entries(LOCALIZED_MEDIA)) {
    if (langFilter && !langFilter.includes(code)) continue;
    for (const part of parts) list.push({ code, folder: media.folder, part });
  }
  return list;
}

function videoKey(job: Job) {
  return `${job.folder}/videos/Final_Part_${job.part}_Full.mp4`;
}
function audioKey(job: Job) {
  return `${job.folder}/audio/Part ${job.part}.mp3`;
}

async function exists(key: string): Promise<boolean> {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return (head.ContentLength ?? 0) > 10_000;
  } catch {
    return false;
  }
}

async function sign(key: string) {
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 6 * 3600 });
}

function extract(inputUrl: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      ffmpeg,
      ["-y", "-loglevel", "error", "-i", inputUrl, "-vn", "-acodec", "libmp3lame", "-b:a", "128k", "-ac", "2", "-ar", "48000", output],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let err = "";
    proc.stderr.on("data", (chunk) => {
      err = (err + chunk.toString()).slice(-1500);
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err || `ffmpeg exit ${code}`));
    });
  });
}

async function upload(key: string, filePath: string) {
  const size = statSync(filePath).size;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: "audio/mpeg",
      ContentLength: size,
    }),
  );
  return size;
}

function log(line: string) {
  console.log(line);
  appendFileSync(logPath, line + "\n");
}

async function runJob(job: Job, state: { done: number; total: number }) {
  const label = `${job.code} ${job.part}`;
  const destKey = audioKey(job);
  if (await exists(destKey)) {
    state.done++;
    log(`${state.done}/${state.total} ${label} skip`);
    return;
  }
  if (!(await exists(videoKey(job)))) {
    state.done++;
    log(`${state.done}/${state.total} ${label} MISSING VIDEO ${videoKey(job)}`);
    return;
  }
  mkdirSync(outDir, { recursive: true });
  const dest = join(outDir, `${job.folder.replace(/[^\w.-]+/g, "_")}-Part-${job.part}.mp3`);
  try {
    await extract(await sign(videoKey(job)), dest);
    const size = await upload(destKey, dest);
    state.done++;
    log(`${state.done}/${state.total} ${label} uploaded ${(size / 1024 / 1024).toFixed(1)} MB`);
  } catch (error) {
    state.done++;
    log(`${state.done}/${state.total} ${label} FAILED ${error instanceof Error ? error.message : error}`);
  } finally {
    if (existsSync(dest)) unlinkSync(dest);
  }
}

async function preflight(list: Job[]) {
  const firsts = new Map<string, Job>();
  for (const job of list) if (job.part === list.find((j) => j.code === job.code)?.part) firsts.set(job.code, job);
  let bad = 0;
  for (const job of firsts.values()) {
    const key = videoKey(job);
    const ok = await exists(key);
    log(`preflight ${job.code} ${key} ${ok ? "ok" : "MISSING"}`);
    if (!ok) bad++;
  }
  if (bad) throw new Error(`${bad} language(s) missing the expected video name. Stopped before extracting.`);
}

async function main() {
  mkdirSync(join(process.cwd(), "tmp"), { recursive: true });
  const list = jobs();
  if (!list.length) throw new Error("no jobs");
  log(`start ${list.length} files, concurrency ${CONCURRENCY}, ffmpeg ${ffmpeg}`);
  await preflight(list);

  const state = { done: 0, total: list.length };
  let cursor = 0;
  async function worker() {
    while (cursor < list.length) {
      const job = list[cursor++];
      await runJob(job, state);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  log("finished");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
