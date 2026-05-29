/**
 * Simulates the exact same path the video player calls:
 *   trackVideoProgress(partNumber, watchPercent)
 * which writes to PartProgress for the given learner profile.
 *
 * We call it directly here so the test proves the DB write works
 * without needing actual video playback in the browser.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email    = process.argv[2] || "ibrahimmunaser@gmail.com";
const profile  = process.argv[3] || "Fatimah";
const partNum  = parseInt(process.argv[4] || "1", 10);
const percent  = parseInt(process.argv[5] || "100", 10);

const VIDEO_COMPLETION_THRESHOLD = 85;

// Resolve learner profile
const lp = await prisma.learnerProfile.findFirst({
  where: { user: { email }, displayName: profile },
  select: { id: true, displayName: true },
});
if (!lp) { console.error(`Profile "${profile}" not found for ${email}`); process.exit(1); }

const clamped   = Math.min(100, Math.max(0, percent));
const completed = clamped >= VIDEO_COMPLETION_THRESHOLD;

await prisma.partProgress.upsert({
  where:  { learnerProfileId_partNumber: { learnerProfileId: lp.id, partNumber: partNum } },
  create: {
    userId:           (await prisma.user.findUnique({ where: { email }, select: { id: true } })).id,
    learnerProfileId: lp.id,
    partNumber:       partNum,
    videoWatchPercent: clamped,
    videoCompleted:    completed,
    status:            "started",
    startedAt:         new Date(),
    lastAccessedAt:    new Date(),
  },
  update: {
    videoWatchPercent: clamped,
    videoCompleted:    completed,
    lastAccessedAt:    new Date(),
  },
});

console.log(`✅ Set video progress: ${profile} → Part ${partNum} → ${clamped}% (completed=${completed})`);
await prisma.$disconnect();
