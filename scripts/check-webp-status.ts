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

async function check(key: string): Promise<"ok" | "missing"> {
  try { await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })); return "ok"; }
  catch { return "missing"; }
}

const TYPES = [
  { label: "Bento",    src: (n: number) => `Infographics-Bento-Grid/Part ${n}.png`,           webp: (n: number) => `Infographics-Bento-Grid/Part ${n}.webp` },
  { label: "Concise",  src: (n: number) => `Infographics-Concise/Part ${n} - Infographic.png`, webp: (n: number) => `Infographics-Concise/Part ${n} - Infographic.webp` },
  { label: "Standard", src: (n: number) => `Infographics-Standard/Part ${n} - Infographic.png`,webp: (n: number) => `Infographics-Standard/Part ${n} - Infographic.webp` },
];

(async () => {
  const missing: string[] = [];
  const noWebp: string[] = [];

  for (let n = 1; n <= 10; n++) {  // check first 10 parts
    for (const t of TYPES) {
      const [srcStatus, webpStatus] = await Promise.all([check(t.src(n)), check(t.webp(n))]);
      if (srcStatus === "missing") missing.push(`Part ${n} ${t.label} PNG`);
      if (webpStatus === "missing") noWebp.push(`Part ${n} ${t.label} WebP`);
    }
  }

  console.log("\nMissing source PNGs:", missing.length ? missing.join(", ") : "none");
  console.log("Missing WebPs:      ", noWebp.length  ? noWebp.join(", ")  : "all present ✓");
})();
