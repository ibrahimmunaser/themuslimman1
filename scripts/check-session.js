const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSession() {
  // Find the most recent session
  const session = await prisma.session.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true
    }
  });
  
  if (session) {
    console.log('✅ Most recent session:');
    console.log(JSON.stringify({
      id: session.id,
      userId: session.userId,
      token: session.token.substring(0, 20) + '...',
      expiresAt: session.expiresAt,
      user: {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username,
        role: session.user.role
      }
    }, null, 2));
  } else {
    console.log('❌ No sessions found');
  }
  
  await prisma.$disconnect();
}

checkSession();
