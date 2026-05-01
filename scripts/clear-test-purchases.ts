import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearPurchases() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'imunaser1' },
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    // Delete all purchase records for this user
    const deleted = await prisma.purchase.deleteMany({
      where: { userId: user.id },
    });

    // Also set hasPaid to false
    await prisma.user.update({
      where: { id: user.id },
      data: { hasPaid: false },
    });

    console.log(`\n✅ Cleared ${deleted.count} purchase record(s)`);
    console.log('User is now in unpaid state');
    console.log('\nWhen you sign in, you should be redirected to /pricing');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearPurchases();
