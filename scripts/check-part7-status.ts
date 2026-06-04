import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "ibrahimmunaser2@gmail.com" },
    include: { learnerProfiles: true },
  });
  if (!user) { console.log("User not found"); return; }

  console.log("activeProfileId (DB column):", user.activeProfileId ?? "(null)");
  console.log("Default profile:", user.learnerProfiles.find(p => p.isDefault)?.id);

  const progress = await prisma.partProgress.findMany({
    where: { userId: user.id, partNumber: { lte: 8 } },
    orderBy: [{ learnerProfileId: "asc" }, { partNumber: "asc" }],
    select: { partNumber: true, quizPassed: true, learnerProfileId: true, status: true },
  });
  console.log("\nParts 1-8 progress across all profiles:");
  console.log(JSON.stringify(progress, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
