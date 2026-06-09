const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'ibrahimmunaser@gmail.com' },
    select: { id: true, email: true, emailVerified: true, hasPaid: true, planType: true, createdAt: true },
  });
  console.log('USER:', JSON.stringify(user, null, 2));

  if (!user) { await prisma.$disconnect(); return; }

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id },
    select: { id: true, status: true, planType: true, amount: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log('PURCHASES:', JSON.stringify(purchases, null, 2));

  const subs = await prisma.subscription.findMany({
    where: { userId: user.id },
    select: { id: true, status: true, planType: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log('SUBSCRIPTIONS:', JSON.stringify(subs, null, 2));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
