import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPurchases() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'ibrahimmunaser3@gmail.com' },
      include: {
        purchases: true,
      },
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\n=== User Account Info ===');
    console.log('Email:', user.email);
    console.log('Full Name:', user.fullName);
    console.log('Has Paid (old flag):', user.hasPaid);
    console.log('\n=== Purchase Records ===');
    
    if (user.purchases.length === 0) {
      console.log('No purchases found - user needs to buy a plan');
    } else {
      user.purchases.forEach((purchase, index) => {
        console.log(`\nPurchase ${index + 1}:`);
        console.log('  Plan:', purchase.planName);
        console.log('  Status:', purchase.status);
        console.log('  Amount:', `$${(purchase.amount / 100).toFixed(2)}`);
        console.log('  Date:', purchase.createdAt.toLocaleString());
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPurchases();
