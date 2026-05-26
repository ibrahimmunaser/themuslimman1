/**
 * Stress-test for thumbnail loading performance.
 * Run: npx tsx scripts/thumbnail-perf-test.ts
 */

import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" }); // fallback to .env if vars not in .env.local

const R2_ACCOUNT_ID        = process.env.R2_ACCOUNT_ID!;
const R2_BUCKET            = process.env.R2_BUCKET!;
const R2_ACCESS_KEY_ID     = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_ENDPOINT          = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

function firstSlideKey(n: number): string {
  const p = String(n).padStart(2, "0");
  return `slides-presented/Part ${p}/Part_${p}_Slide_001_watermarked.png`;
}

// ── 1. Time signing 100 URLs ──────────────────────────────────────────────────
async function benchmarkSigning(count: number) {
  const parts = Array.from({ length: count }, (_, i) => i + 1);
  const start = Date.now();

  await Promise.all(
    parts.map((n) =>
      getSignedUrl(r2 as any, new GetObjectCommand({ Bucket: R2_BUCKET, Key: firstSlideKey(n) }), { expiresIn: 7200 })
    )
  );

  const ms = Date.now() - start;
  console.log(`\n[1] Signing ${count} URLs in parallel: ${ms}ms  (${(ms / count).toFixed(1)}ms each)\n`);
}

// ── 2. Check file sizes for first N parts ────────────────────────────────────
async function checkFileSizes(parts: number[]) {
  console.log("[2] File sizes (HEAD requests in parallel):");

  const results = await Promise.all(
    parts.map(async (n) => {
      const key = firstSlideKey(n);
      try {
        const res = await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
        const bytes = res.ContentLength ?? 0;
        return { n, key, bytes, exists: true };
      } catch (err: any) {
        return { n, key, bytes: 0, exists: false, error: err?.message };
      }
    })
  );

  let totalBytes = 0;
  let missing = 0;
  for (const r of results) {
    if (!r.exists) {
      console.log(`  Part ${String(r.n).padStart(3)} ✗ MISSING  (${r.error})`);
      missing++;
    } else {
      const kb = (r.bytes / 1024).toFixed(1);
      const mb = (r.bytes / 1024 / 1024).toFixed(2);
      const flag = r.bytes > 500_000 ? " ⚠️  LARGE" : "";
      console.log(`  Part ${String(r.n).padStart(3)}  ${kb.padStart(8)} KB  (${mb} MB)${flag}`);
      totalBytes += r.bytes;
    }
  }

  const found = results.length - missing;
  const avgKb = found > 0 ? ((totalBytes / found) / 1024).toFixed(1) : "0";
  const totalMb = (totalBytes / 1024 / 1024).toFixed(1);
  console.log(`\n  Found: ${found}/${results.length}  |  Missing: ${missing}`);
  console.log(`  Avg size: ${avgKb} KB  |  Total data for all thumbnails: ${totalMb} MB`);
  console.log(`  → On a 10 Mbps connection that's ~${((totalBytes * 8) / 10_000_000).toFixed(1)}s to download all at once\n`);
}

// ── 3. Measure one actual download ───────────────────────────────────────────
async function measureDownload(partNum: number) {
  console.log(`[3] Download timing for Part ${partNum} thumbnail:`);
  const key = firstSlideKey(partNum);

  const url = await getSignedUrl(
    r2 as any,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn: 300 }
  );

  const start = Date.now();
  const res = await fetch(url);
  const headersMs = Date.now() - start;

  const buffer = await res.arrayBuffer();
  const totalMs = Date.now() - start;

  const kb = (buffer.byteLength / 1024).toFixed(1);
  console.log(`  Time to first byte: ${headersMs}ms`);
  console.log(`  Total download:     ${totalMs}ms  (${kb} KB)\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  console.log("=".repeat(60));
  console.log(" Thumbnail Performance Diagnostic");
  console.log("=".repeat(60));

  if (!R2_BUCKET || !R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID) {
    console.error("Missing R2 env vars — make sure .env.local is populated");
    process.exit(1);
  }

  await benchmarkSigning(100);
  await checkFileSizes(Array.from({ length: 20 }, (_, i) => i + 1));
  await measureDownload(1);

  console.log("=".repeat(60));
  console.log("Done.");
})();
