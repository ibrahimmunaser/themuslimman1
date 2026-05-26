import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
});
const BUCKET = process.env.R2_BUCKET!;

async function listPrefix(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await r2.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }));
    for (const obj of res.Contents ?? []) if (obj.Key) keys.push(obj.Key);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

(async () => {
  const prefixes = [
    "Infographics-Concise/",
    "Infographics-Bento-Grid/",
    "Infographics-Standard/",
    "mindmaps/",
  ];

  for (const prefix of prefixes) {
    const keys = await listPrefix(prefix);
    console.log(`\n=== ${prefix} (${keys.length} files) ===`);
    keys.sort().forEach(k => console.log(" ", k));
  }
})();
