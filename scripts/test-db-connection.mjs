import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  await prisma.$queryRaw`SELECT 1 as ok`;
  console.log("DB connection OK");

  const count = await prisma.subscription.count({
    where: { status: "past_due", gracePeriodEndsAt: null },
  });
  console.log("past_due subs needing backfill:", count);
} catch (e) {
  console.error("DB connection FAILED:", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
