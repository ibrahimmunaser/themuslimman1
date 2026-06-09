const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, emailVerified: true, hasPaid: true, planType: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log('USERS:', JSON.stringify(users, null, 2));

  for (const u of users) {
    const subs = await prisma.subscription.findMany({
      where: { userId: u.id },
      select: { status: true, stripeSubscriptionId: true, currentPeriodEnd: true },
      orderBy: { createdAt: 'desc' },
    });
    if (subs.length) console.log(`  ${u.email} SUBS:`, JSON.stringify(subs));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
