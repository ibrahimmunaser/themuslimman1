/**
 * Temporary script: mark Parts 1–6 quiz as passed for a specific user
 * so Part 7 becomes accessible for video testing.
 *
 * The LessonsPathView cascades from the first unmet prerequisite, so
 * all preceding parts must also have quizPassed=true.
 *
 * Usage:
 *   npx tsx scripts/unlock-part7-for-testing.ts [email]
 *
 * Default email: ibrahimmunaser2@gmail.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] ?? "ibrahimmunaser2@gmail.com";
  const partsToMark = [1, 2, 3, 4, 5, 6]; // mark all prereqs so Part 7 unlocks

  const user = await prisma.user.findUnique({
    where: { email },
    include: { learnerProfiles: true },
  });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`User: ${user.fullName} (${user.email})`);
  console.log(`Learner profiles: ${user.learnerProfiles.length}\n`);

  if (user.learnerProfiles.length === 0) {
    console.error("No learner profiles found.");
    process.exit(1);
  }

  for (const profile of user.learnerProfiles) {
    console.log(`Profile: "${profile.displayName}" (${profile.id})`);
    for (const partNum of partsToMark) {
      await prisma.partProgress.upsert({
        where: {
          learnerProfileId_partNumber: {
            learnerProfileId: profile.id,
            partNumber: partNum,
          },
        },
        create: {
          id:               crypto.randomUUID(),
          userId:           user.id,
          learnerProfileId: profile.id,
          partNumber:       partNum,
          status:           "completed",
          quizPassed:       true,
          quizBestScore:    100,
          quizCompleted:    true,
          updatedAt:        new Date(),
        },
        update: {
          quizPassed:    true,
          quizBestScore: 100,
          quizCompleted: true,
          status:        "completed",
          updatedAt:     new Date(),
        },
      });
      process.stdout.write(`  ✓ Part ${partNum} quiz = passed\n`);
    }
    console.log();
  }

  console.log("Done. Refresh the dashboard — Part 7 will now be unlocked.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
