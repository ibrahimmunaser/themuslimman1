import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const email = process.argv[2];
if (!email) { console.error("Usage: npx tsx scripts/delete-user.ts <email>"); process.exit(1); }

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, fullName: true, email: true },
  });

  if (!user) { console.log("No user found with email:", email); return; }

  console.log("Found user:", user);
  console.log("Deleting...");

  await prisma.user.delete({ where: { id: user.id } });

  console.log("Deleted successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
