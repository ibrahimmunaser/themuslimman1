/**
 * Stress-test for infographic loading performance.
 * Run: npx tsx scripts/infographic-perf-test.ts
 */

import { S3Client, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const R2_ACCOUNT_ID        = process.env.R2_ACCOUNT_ID!;
const R2_BUCKET            = process.env.R2_BUCKET!;
const R2_ACCESS_KEY_ID     = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const ENDPOINT             = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const r2 = new S3Client({
  region: "auto",
  endpoint: ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const ASSET_TYPES = [
  { label: "Bento Grid",  key: (n: number) => `Infographics-Bento-Grid/Part ${n}.png` },
  { label: "Concise",     key: (n: number) => `Infographics-Concise/Part ${n} - Infographic.png` },
  { label: "Standard",    key: (n: number) => `Infographics-Standard/Part ${n} - Infographic.png` },
  { label: "Mind Map",    key: (n: number) => `mindmaps/Part ${n} - Mindmap.png` },
];

async function headSize(key: string): Promise<number | null> {
  try {
    const res = await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return res.ContentLength ?? null;
  } catch {
    return null;
  }
}

async function measureDownload(key: string, label: string) {
  const url = await getSignedUrl(r2 as any, new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }), { expiresIn: 300 });
  const start = Date.now();
  const res = await fetch(url);
  const ttfb = Date.now() - start;
  const buf = await res.arrayBuffer();
  const total = Date.now() - start;
  const kb = (buf.byteLength / 1024).toFixed(0);
  console.log(`  ${label.padEnd(12)} TTFB: ${String(ttfb).padStart(4)}ms  Total: ${String(total).padStart(5)}ms  Size: ${kb} KB`);
}

(async () => {
  console.log("=".repeat(65));
  console.log(" Infographic Performance Diagnostic");
  console.log("=".repeat(65));

  // ── 1. File sizes for parts 1-5 across all types ─────────────────
  console.log("\n[1] File sizes (HEAD requests, parts 1–5):\n");
  const SAMPLE = [1, 2, 3, 4, 5];

  for (const type of ASSET_TYPES) {
    process.stdout.write(`  ${type.label.padEnd(14)}`);
    let total = 0, found = 0;
    for (const n of SAMPLE) {
      const bytes = await headSize(type.key(n));
      if (bytes) {
        process.stdout.write(` Part${n}: ${(bytes / 1024 / 1024).toFixed(1)}MB`);
        total += bytes;
        found++;
      } else {
        process.stdout.write(` Part${n}: MISSING`);
      }
    }
    const avgMb = found > 0 ? (total / found / 1024 / 1024).toFixed(1) : "—";
    console.log(`   (avg ${avgMb} MB)`);
  }

  // ── 2. Download timing for Part 1 of each type ───────────────────
  console.log("\n[2] Download timing for Part 1 (direct R2 fetch):\n");
  for (const type of ASSET_TYPES) {
    const key = type.key(1);
    const size = await headSize(key);
    if (size) {
      await measureDownload(key, type.label);
    } else {
      console.log(`  ${type.label.padEnd(12)} MISSING`);
    }
  }

  console.log("\n" + "=".repeat(65));
  console.log(" Diagnosis complete.");
  console.log("=".repeat(65));
})();
