/**
 * Reset test quiz progress: sets quizPassed=false for Parts 1–6
 * so only Part 1 is naturally accessible (no prior quiz needed).
 *
 * Usage:
 *   npx tsx scripts/reset-to-part1-only.ts [email]
 *
 * Default email: ibrahimmunaser2@gmail.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] ?? "ibrahimmunaser2@gmail.com";

  const user = await prisma.user.findUnique({
    where: { email },
    include: { learnerProfiles: true },
  });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`User: ${user.fullName} (${user.email})`);

  for (const profile of user.learnerProfiles) {
    console.log(`\nProfile: "${profile.displayName}" (${profile.id})`);
    const result = await prisma.partProgress.updateMany({
      where: {
        learnerProfileId: profile.id,
        partNumber: { in: [1, 2, 3, 4, 5, 6] },
      },
      data: {
        quizPassed:    false,
        quizCompleted: false,
        quizBestScore: 0,
        status:        "in_progress",
        updatedAt:     new Date(),
      },
    });
    console.log(`  ✓ Reset ${result.count} part progress rows`);
  }

  console.log("\nDone. Only Part 1 is now accessible. Do a hard refresh (Ctrl+Shift+R).");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
