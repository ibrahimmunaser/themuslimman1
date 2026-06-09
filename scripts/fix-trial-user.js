// Fix the user who got a premature trial subscription before payment
const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'ibrahimmunaser@gmail.com';
  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, email: true, emailVerified: true, hasPaid: true, planType: true, stripeCustomerId: true },
  });
  console.log('USER:', JSON.stringify(user, null, 2));

  if (!user) { console.log('User not found'); await prisma.$disconnect(); return; }

  const subs = await prisma.subscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  console.log('SUBSCRIPTIONS:', JSON.stringify(subs, null, 2));

  if (subs.length > 0) {
    console.log(`\nDeleting ${subs.length} subscription row(s)...`);
    await prisma.subscription.deleteMany({ where: { userId: user.id } });
    console.log('Deleted.');
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
