/**
 * Generic helper: upload a local text/JSON file to an R2 key.
 * Used when content has already been translated (e.g. by the agent) and just
 * needs to be pushed to R2 under the arabic/ prefix — no external API needed.
 *
 * Usage:
 *   node scripts/upload-text-to-r2.js --key "arabic/briefing/Part 1 Briefing Document.md" --file tmp-ar-briefing-1.md
 *   node scripts/upload-text-to-r2.js --key "arabic/quizzes/Part_01.json" --file tmp.json --content-type application/json
 */
"use strict";

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, arr) => {
    if (!a.startsWith("--")) return [];
    const flag = a.slice(2);
    const next = arr[i + 1];
    if (next && !next.startsWith("--")) return [flag, next];
    return [flag, true];
  }).filter((p) => p.length)
);

if (!args.key || !args.file) {
  console.error("Usage: node scripts/upload-text-to-r2.js --key <r2Key> --file <localPath> [--content-type <type>]");
  process.exit(1);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const contentType = args["content-type"] || (args.key.endsWith(".json") ? "application/json" : "text/markdown; charset=utf-8");

(async () => {
  const body = fs.readFileSync(args.file, "utf-8");
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: args.key,
    Body: body,
    ContentType: contentType,
  }));
  console.log(`✓ uploaded ${args.file} (${body.length} chars) → ${args.key}`);
})().catch((e) => {
  console.error("Upload failed:", e.message);
  process.exit(1);
});
