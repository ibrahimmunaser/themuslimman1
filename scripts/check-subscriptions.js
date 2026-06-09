const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const subs = await prisma.subscription.findMany({
    where: { status: { in: ['active', 'trialing', 'past_due'] } },
    select: {
      stripeSubscriptionId: true,
      status: true,
      stripePriceId: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      user: { select: { email: true, planType: true, hasPaid: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`\nActive subscriptions: ${subs.length}\n`);
  for (const s of subs) {
    console.log(`  ${s.user.email}`);
    console.log(`    status: ${s.status}  planType: ${s.user.planType}  hasPaid: ${s.user.hasPaid}`);
    console.log(`    priceId: ${s.stripePriceId}`);
    console.log(`    periodEnd: ${s.currentPeriodEnd}  cancelAtEnd: ${s.cancelAtPeriodEnd}`);
    console.log(`    subId: ${s.stripeSubscriptionId}`);
    console.log();
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
