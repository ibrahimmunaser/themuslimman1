import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const email = process.argv[2] ?? "ibrahimmunaser2@gmail.com";
  const user = await prisma.user.findUnique({
    where: { email },
    include: { learnerProfiles: true },
  });
  if (!user) { console.error("User not found"); process.exit(1); }
  for (const profile of user.learnerProfiles) {
    const r = await prisma.partProgress.updateMany({
      where: { learnerProfileId: profile.id, partNumber: { gte: 2 } },
      data: { status: "not_started", updatedAt: new Date() },
    });
    console.log(`Profile "${profile.displayName}" — reset ${r.count} rows to not_started`);
  }
  console.log("Done.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
