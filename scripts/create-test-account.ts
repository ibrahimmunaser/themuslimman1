import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestAccount() {
  try {
    // Check if account already exists
    const existing = await prisma.user.findUnique({
      where: { username: 'imunaser1' },
    });

    if (existing) {
      console.log('Account already exists. Updating to paid status...');
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          hasPaid: true,
          emailVerified: true,
          isActive: true,
        },
      });
      console.log('✅ Account updated successfully!');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('Fatass222?', 12);

    // Create user and student profile
    const user = await prisma.user.create({
      data: {
        fullName: 'Ibrahim Munaser',
        email: 'ibrahimmunaser@gmail.com',
        username: 'imunaser1',
        passwordHash,
        role: 'student',
        emailVerified: true,
        isActive: true,
        hasPaid: true,
        student: {
          create: {
            isActive: true,
          },
        },
      },
      include: {
        student: true,
      },
    });

    console.log('\n✅ Test account created successfully!\n');
    console.log('Username: imunaser1');
    console.log('Password: Fatass222?');
    console.log('Email:', user.email);
    console.log('Has Paid:', user.hasPaid);
    console.log('\nYou can now sign in at /login');
    
  } catch (error) {
    console.error('Error creating test account:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestAccount();
