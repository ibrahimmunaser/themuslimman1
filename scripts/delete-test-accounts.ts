import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteRecentTestAccounts() {
  try {
    // Find all users created in the last 24 hours
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        },
        role: 'student'
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\nFound ${recentUsers.length} recent test accounts:\n`);
    
    recentUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} (${user.username})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log('');
    });

    if (recentUsers.length === 0) {
      console.log('No recent test accounts found.');
      return;
    }

    // Delete all recent test accounts (cascades to related data)
    const deleted = await prisma.user.deleteMany({
      where: {
        id: {
          in: recentUsers.map(u => u.id)
        }
      }
    });

    console.log(`✅ Successfully deleted ${deleted.count} test accounts.\n`);
    
  } catch (error) {
    console.error('Error deleting test accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteRecentTestAccounts();
