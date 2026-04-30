const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'ibrahimmunaser26@gmail.com' }
  });
  
  if (user) {
    console.log('✅ User exists:');
    console.log(JSON.stringify({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      emailVerified: user.emailVerified,
      role: user.role,
      createdAt: user.createdAt
    }, null, 2));
  } else {
    console.log('❌ User does NOT exist');
  }
  
  await prisma.$disconnect();
}

checkUser();
