import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.partProgress.updateMany({
    data: {
      status: "not_started",
      quizPassed: false,
      quizBestScore: 0,
      quizAttempts: 0,
      videoWatchPercent: 0,
      briefingOpened: false,
      flashcardsReviewed: false,
    },
  });

  console.log(`Reset ALL ${result.count} partProgress rows — everything locked.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
