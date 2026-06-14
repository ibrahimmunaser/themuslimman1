import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const subs = await prisma.subscription.findMany({
  where: { status: { in: ["active", "trialing", "past_due"] } },
  select: {
    stripeSubscriptionId: true,
    stripePriceId: true,
    status: true,
    currentPeriodEnd: true,
    userId: true,
    user: { select: { email: true, fullName: true, planType: true } },
  },
  orderBy: { createdAt: "asc" },
});

// Group by price ID
const byPrice = {};
for (const s of subs) {
  const pid = s.stripePriceId;
  if (!byPrice[pid]) byPrice[pid] = [];
  byPrice[pid].push(s);
}

console.log(`\nTotal active/trialing/past_due subscriptions: ${subs.length}\n`);
for (const [priceId, list] of Object.entries(byPrice)) {
  console.log(`Price ID: ${priceId} — ${list.length} subscriber(s)`);
  for (const s of list) {
    console.log(`  ${s.user?.email ?? s.userId}  status=${s.status}  ends=${s.currentPeriodEnd?.toISOString()?.split("T")[0]}`);
  }
}
await prisma.$disconnect();
