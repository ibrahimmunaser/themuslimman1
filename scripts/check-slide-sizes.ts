import { S3Client, HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
});
const BUCKET = process.env.R2_BUCKET!;

async function getSize(key: string): Promise<number | null> {
  try {
    const r = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return r.ContentLength ?? null;
  } catch { return null; }
}

async function listPrefix(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const r = await r2.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }));
    for (const obj of r.Contents ?? []) if (obj.Key) keys.push(obj.Key);
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

function fmt(bytes: number) {
  if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

(async () => {
  // Check Part 1 slides across all 3 types
  for (const prefix of ["slides-presented/Part 01/", "slides-detailed/Part 1 Watermark/", "slides-facts/Part 1/"]) {
    const keys = await listPrefix(prefix);
    const pngs = keys.filter(k => k.endsWith(".png"));
    const webpMediums = keys.filter(k => k.endsWith("-medium.webp"));
    const webpThumbs = keys.filter(k => k.endsWith("-thumb.webp"));

    console.log(`\n=== ${prefix} ===`);
    console.log(`  PNGs: ${pngs.length}, -medium.webp: ${webpMediums.length}, -thumb.webp: ${webpThumbs.length}`);

    if (pngs.length > 0) {
      // Sample first 3 PNG sizes
      const sample = pngs.slice(0, 3);
      const sizes = await Promise.all(sample.map(k => getSize(k)));
      sizes.forEach((s, i) => {
        if (s !== null) console.log(`  PNG  ${sample[i].split("/").pop()}: ${fmt(s)}`);
      });
    }

    if (webpMediums.length > 0) {
      const sample = webpMediums.slice(0, 3);
      const sizes = await Promise.all(sample.map(k => getSize(k)));
      sizes.forEach((s, i) => {
        if (s !== null) console.log(`  WebP ${sample[i].split("/").pop()}: ${fmt(s)}`);
      });
    }
  }
})();
