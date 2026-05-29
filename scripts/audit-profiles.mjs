import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.argv[2] || "ibrahimmunaser@gmail.com";

const user = await prisma.user.findUnique({
  where: { email },
  select: { id: true, fullName: true, planType: true },
});

if (!user) { console.log("User not found"); process.exit(1); }

console.log(`\n═══════════════════════════════════════════`);
console.log(`Account: ${user.fullName} (${email})`);
console.log(`Plan: ${user.planType}`);
console.log(`═══════════════════════════════════════════\n`);

const profiles = await prisma.learnerProfile.findMany({
  where: { userId: user.id },
  orderBy: { createdAt: "asc" },
  select: {
    id: true,
    displayName: true,
    isDefault: true,
    _count: { select: { partProgress: true, studySessions: true } },
  },
});

console.log(`Profiles (${profiles.length}):`);
for (const p of profiles) {
  console.log(`  [${p.isDefault ? "DEFAULT" : "      "}] ${p.displayName.padEnd(20)} id=${p.id}`);
  console.log(`           parts tracked: ${p._count.partProgress}  study sessions: ${p._count.studySessions}`);
}

// Show detailed progress per profile
console.log(`\n─── Detailed progress per profile ───────────\n`);
for (const p of profiles) {
  const progress = await prisma.partProgress.findMany({
    where: { learnerProfileId: p.id },
    orderBy: { partNumber: "asc" },
    select: {
      partNumber: true,
      status: true,
      videoWatchPercent: true,
      briefingOpened: true,
      quizPassed: true,
      flashcardsReviewed: true,
      openedAssets: true,
    },
  });

  if (progress.length === 0) {
    console.log(`${p.displayName}: no progress recorded`);
  } else {
    console.log(`${p.displayName}:`);
    for (const row of progress) {
      const assets = (() => { try { return JSON.parse(row.openedAssets); } catch { return []; } })();
      console.log(
        `  Part ${String(row.partNumber).padStart(3)}: status=${row.status.padEnd(12)} ` +
        `video=${String(row.videoWatchPercent).padStart(3)}%  ` +
        `briefing=${row.briefingOpened ? "✓" : "✗"}  ` +
        `quiz=${row.quizPassed ? "✓" : "✗"}  ` +
        `flashcards=${row.flashcardsReviewed ? "✓" : "✗"}  ` +
        `assets=[${assets.join(",")}]`
      );
    }
  }
  console.log();
}

await prisma.$disconnect();
