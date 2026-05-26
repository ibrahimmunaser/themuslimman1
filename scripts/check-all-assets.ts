import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
});
const BUCKET = process.env.R2_BUCKET!;

async function exists(key: string): Promise<boolean> {
  try { await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })); return true; }
  catch { return false; }
}

const TYPES = [
  { label: "Bento",    webp: (n: number) => `Infographics-Bento-Grid/Part ${n}.webp`,           png: (n: number) => `Infographics-Bento-Grid/Part ${n}.png` },
  { label: "Concise",  webp: (n: number) => `Infographics-Concise/Part ${n} - Infographic.webp`, png: (n: number) => `Infographics-Concise/Part ${n} - Infographic.png` },
  { label: "Standard", webp: (n: number) => `Infographics-Standard/Part ${n} - Infographic.webp`,png: (n: number) => `Infographics-Standard/Part ${n} - Infographic.png` },
  { label: "MindMap",  webp: (n: number) => `mindmaps/Part ${n} - Mindmap.webp`,                 png: (n: number) => `mindmaps/Part ${n} - Mindmap.png` },
];

(async () => {
  console.log("Checking all 100 parts × 4 types...\n");

  const missing: string[] = [];
  const noWebp: string[] = [];

  // Check in batches of 10 parts at a time
  for (let i = 0; i < 100; i += 10) {
    const batch = Array.from({ length: 10 }, (_, j) => i + j + 1);
    await Promise.all(batch.flatMap(n =>
      TYPES.map(async t => {
        const [hasPng, hasWebp] = await Promise.all([exists(t.png(n)), exists(t.webp(n))]);
        if (!hasPng && !hasWebp) missing.push(`Part ${n} ${t.label}`);
        else if (!hasWebp)       noWebp.push(`Part ${n} ${t.label} (PNG exists, no WebP)`);
      })
    ));
  }

  if (missing.length === 0) {
    console.log("✓ No missing assets — all source files exist");
  } else {
    console.log(`✗ Missing entirely (no PNG or WebP): ${missing.length}`);
    missing.forEach(m => console.log(`  - ${m}`));
  }

  console.log();

  if (noWebp.length === 0) {
    console.log("✓ All assets have WebP versions");
  } else {
    console.log(`⚠ PNG exists but no WebP yet: ${noWebp.length}`);
    noWebp.forEach(m => console.log(`  - ${m}`));
  }
})();
