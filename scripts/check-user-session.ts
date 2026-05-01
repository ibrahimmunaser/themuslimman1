import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSessions() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'imunaser1' },
      include: {
        sessions: {
          where: {
            expiresAt: {
              gt: new Date(), // Only active sessions
            },
          },
        },
      },
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\n=== User Session Info ===');
    console.log('Username:', user.username);
    console.log('Active Sessions:', user.sessions.length);
    
    if (user.sessions.length > 0) {
      console.log('\nYou have active sessions. Clearing them...');
      await prisma.session.deleteMany({
        where: { userId: user.id },
      });
      console.log('✅ All sessions cleared. You are now logged out.');
      console.log('Try visiting /login again.');
    } else {
      console.log('\nNo active sessions found. You should be able to access /login');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessions();
