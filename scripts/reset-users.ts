import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  console.log(`Deleting ${count} user(s)...`);

  // Cascade handles: Session, StudentProfile, Purchase, PartProgress,
  // StudySession, ActivityLog (SetNull), and all student sub-records.
  await prisma.user.deleteMany({});

  console.log("Done. All accounts deleted.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
