/**
 * Stress-test: verify currentPart computation always returns 1 when DB is clean.
 * Mirrors the exact logic in app/seerah/page.tsx.
 */
import { PrismaClient } from "@prisma/client";
import { PARTS } from "../lib/content";

const prisma = new PrismaClient();

async function computeCurrentPart(learnerProfileId: string): Promise<number> {
  const allPartProgress = await prisma.partProgress.findMany({
    where: { learnerProfileId },
    orderBy: { partNumber: "asc" },
    select: { partNumber: true, status: true, quizPassed: true },
  });

  const completedParts = allPartProgress.filter(p => p.quizPassed).map(p => p.partNumber);
  const inProgressParts = allPartProgress.filter(p => p.status === "started").map(p => p.partNumber);
  const quizPassedSet = new Set(completedParts);

  const maxAccessiblePart = (() => {
    for (let n = 2; n <= PARTS.length; n++) {
      if (!quizPassedSet.has(n - 1)) return n - 1;
    }
    return PARTS.length;
  })();

  const accessibleInProgress = inProgressParts.filter(n => n <= maxAccessiblePart);
  const accessibleCompleted  = completedParts.filter(n => n <= maxAccessiblePart);

  let currentPart: number;
  if (accessibleInProgress.length > 0) {
    currentPart = Math.min(...accessibleInProgress);
  } else if (accessibleCompleted.length > 0) {
    currentPart = Math.min(Math.max(...accessibleCompleted) + 1, maxAccessiblePart);
  } else {
    currentPart = 1;
  }

  return currentPart;
}

async function main() {
  const allProfiles = await prisma.learnerProfile.findMany({ select: { id: true, userId: true } });

  console.log(`Checking ${allProfiles.length} profiles...\n`);
  let anyWrong = false;

  for (const profile of allProfiles) {
    const cp = await computeCurrentPart(profile.id);
    const status = cp === 1 ? "✓" : "✗ BUG";
    if (cp !== 1) anyWrong = true;
    console.log(`${status}  Profile ${profile.id.slice(0, 24)}... → currentPart = ${cp}`);
  }

  console.log(anyWrong ? "\n❌ Bug found — some profiles return wrong currentPart!" : "\n✅ All profiles correctly return currentPart = 1");
}

main().catch(console.error).finally(() => prisma.$disconnect());
