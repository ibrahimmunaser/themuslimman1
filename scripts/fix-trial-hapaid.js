// Fix users who have hasPaid=true but are actually trial subscribers (not lifetime buyers).
// This happens when the old webhook code ran before the fix that stopped setting hasPaid=true for trials.
const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find users with hasPaid=true but no lifetime purchase row, only a trialing subscription
  const users = await prisma.user.findMany({
    where: { hasPaid: true },
    select: { id: true, email: true, hasPaid: true },
  });

  for (const u of users) {
    const lifetimePurchase = await prisma.purchase.findFirst({
      where: { userId: u.id, status: 'succeeded' },
    });
    if (lifetimePurchase) {
      console.log(`SKIP ${u.email} — has a lifetime purchase row, hasPaid=true is correct`);
      continue;
    }

    const trialSub = await prisma.subscription.findFirst({
      where: { userId: u.id, status: 'trialing' },
    });
    if (trialSub) {
      console.log(`FIX  ${u.email} — trialing sub found, no lifetime purchase, resetting hasPaid=false`);
      await prisma.user.update({ where: { id: u.id }, data: { hasPaid: false } });
    } else {
      console.log(`SKIP ${u.email} — no trialing sub and no purchase, leaving as-is`);
    }
  }

  await prisma.$disconnect();
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
