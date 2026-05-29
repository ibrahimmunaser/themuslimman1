import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.argv[2] || "ibrahimmunaser@gmail.com";

const result = await prisma.user.updateMany({
  where: { email },
  data: { planType: "family", hasPaid: true },
});

console.log(`✅ Updated ${result.count} user(s) — planType = family, hasPaid = true`);

// Verify
const user = await prisma.user.findUnique({
  where: { email },
  select: { email: true, fullName: true, planType: true, hasPaid: true },
});
console.log("Current state:", user);

await prisma.$disconnect();
