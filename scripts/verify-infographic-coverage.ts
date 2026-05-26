import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

// Inline the same logic as r2GetInfographicKey to test it directly
import { S3Client, HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
});
const BUCKET = process.env.R2_BUCKET!;

async function r2FileExists(key: string): Promise<boolean> {
  try { await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })); return true; }
  catch { return false; }
}

const listCache = new Map<string, string[]>();
async function r2ListFiles(prefix: string): Promise<string[]> {
  if (listCache.has(prefix)) return listCache.get(prefix)!;
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await r2.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }));
    for (const obj of res.Contents ?? []) if (obj.Key) keys.push(obj.Key);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  listCache.set(prefix, keys);
  return keys;
}

async function r2GetInfographicKey(partNum: number, style: "Bento Grid" | "Concise" | "Standard"): Promise<string | null> {
  const folderMap: Record<string, string> = {
    "Bento Grid": "Infographics-Bento-Grid",
    "Concise": "Infographics-Concise",
    "Standard": "Infographics-Standard",
  };
  const prefix = `${folderMap[style]}/`;

  const simpleWebp = `${prefix}Part ${partNum}.webp`;
  if (await r2FileExists(simpleWebp)) return simpleWebp;
  const suffixWebp = `${prefix}Part ${partNum} - Infographic.webp`;
  if (await r2FileExists(suffixWebp)) return suffixWebp;
  const simpleKey = `${prefix}Part ${partNum}.png`;
  if (await r2FileExists(simpleKey)) return simpleKey;

  const files = await r2ListFiles(prefix);

  const withSuffix = files.find(f => f === `${prefix}Part ${partNum} - Infographic.png`);
  if (withSuffix) return withSuffix;

  // Loose regex: any .webp or .png file that starts with "Part N" (non-digit follows)
  const looseRe = new RegExp(`^${prefix.replace(/\//g, "\\/")}Part ${partNum}[^0-9]`);
  const looseMatchWebp = files.find(f => f.endsWith(".webp") && looseRe.test(f));
  if (looseMatchWebp) return looseMatchWebp;

  const looseMatchPng = files.find(f => f.endsWith(".png") && looseRe.test(f));
  return looseMatchPng ?? null;
}

(async () => {
  console.log("Pre-loading folder listings...");
  await Promise.all([
    r2ListFiles("Infographics-Bento-Grid/"),
    r2ListFiles("Infographics-Concise/"),
    r2ListFiles("Infographics-Standard/"),
  ]);

  console.log("Testing all 100 parts × 3 types...\n");
  const missed: string[] = [];

  // Test in batches of 10
  for (let i = 0; i < 100; i += 10) {
    const batch = Array.from({ length: 10 }, (_, j) => i + j + 1);
    await Promise.all(batch.flatMap(n =>
      (["Bento Grid", "Concise", "Standard"] as const).map(async style => {
        const key = await r2GetInfographicKey(n, style);
        if (!key) missed.push(`Part ${n} ${style}`);
      })
    ));
  }

  if (missed.length === 0) {
    console.log("✓ All 300 infographics (100 parts × 3 types) resolve to a real R2 key.");
  } else {
    console.log(`✗ ${missed.length} still unresolved:`);
    missed.forEach(m => console.log(`  - ${m}`));
  }
})();
