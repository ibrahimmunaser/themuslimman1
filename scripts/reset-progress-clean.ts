import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Show current state
  const rows = await prisma.partProgress.findMany({
    select: {
      learnerProfileId: true,
      partNumber: true,
      status: true,
      quizPassed: true,
      videoWatchPercent: true,
    },
    orderBy: [{ learnerProfileId: "asc" }, { partNumber: "asc" }],
  });

  console.log("Current partProgress rows:");
  console.table(rows);

  // Reset all parts > 1 to locked/clean state
  const result = await prisma.partProgress.updateMany({
    where: { partNumber: { gt: 1 } },
    data: {
      status: "locked",
      quizPassed: false,
      quizBestScore: 0,
      quizAttempts: 0,
      videoWatchPercent: 0,
      briefingOpened: false,
      flashcardsReviewed: false,
    },
  });

  console.log(`\nReset ${result.count} rows (parts > 1) to locked/clean.`);

  // Also reset Part 1 status to "not_started" if it was "started" with no progress
  await prisma.partProgress.updateMany({
    where: { partNumber: 1, status: "started", videoWatchPercent: 0 },
    data: { status: "not_started" },
  });

  console.log("Done. Part 1 is now the only accessible part.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
