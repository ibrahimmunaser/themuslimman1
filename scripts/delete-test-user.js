const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteUser() {
  try {
    const result = await prisma.user.delete({
      where: { email: 'ibrahimmunaser26@gmail.com' }
    });
    
    console.log('✅ Successfully deleted user:', result.email);
  } catch (error) {
    if (error.code === 'P2025') {
      console.log('❌ User not found');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
