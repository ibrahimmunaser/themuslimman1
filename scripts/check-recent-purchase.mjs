import { PrismaClient } from "@prisma/client";
import fs from "fs";

// Load DATABASE_URL from the pulled production env file without extra deps.
const envText = fs.readFileSync(".env.vercel.production", "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const prisma = new PrismaClient();

const since = new Date(Date.now() - 3 * 60 * 60 * 1000);

const users = await prisma.user.findMany({
  where: { createdAt: { gte: since } },
  select: {
    id: true, fullName: true, email: true, isAnonymous: true, hasPaid: true,
    planType: true, createdAt: true,
  },
  orderBy: { createdAt: "desc" },
  take: 20,
});
console.log("=== Recent users (last 3h) ===");
for (const u of users) console.log(JSON.stringify(u));

const purchases = await prisma.mobilePurchase.findMany({
  where: { createdAt: { gte: since } },
  orderBy: { createdAt: "desc" },
  take: 20,
});
console.log("\n=== Recent MobilePurchase rows (last 3h) ===");
for (const p of purchases) {
  console.log(JSON.stringify({
    id: p.id, userId: p.userId, platform: p.platform, productId: p.productId,
    transactionId: p.transactionId, planType: p.planType, purchaseType: p.purchaseType,
    status: p.status, createdAt: p.createdAt,
  }));
}

await prisma.$disconnect();
