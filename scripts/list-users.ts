import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        hasPaid: true,
        createdAt: true,
        _count: {
          select: {
            purchases: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('\n=== All Users ===');
    console.log(`Found ${users.length} user(s)\n`);
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log('  Name:', user.fullName);
      console.log('  Email:', user.email);
      console.log('  Has Paid Flag:', user.hasPaid);
      console.log('  Purchase Count:', user._count.purchases);
      console.log('  Created:', user.createdAt.toLocaleString());
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
