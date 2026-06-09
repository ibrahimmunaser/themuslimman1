const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) { console.error('Usage: node delete-user.js <email>'); process.exit(1); }

  const user = await prisma.user.findFirst({ where: { email }, select: { id: true, email: true } });
  if (!user) { console.log('User not found:', email); await prisma.$disconnect(); return; }
  console.log('Deleting user:', user.email, user.id);

  await prisma.subscription.deleteMany({ where: { userId: user.id } });
  await prisma.purchase.deleteMany({ where: { userId: user.id } });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log('Done.');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
