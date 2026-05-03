import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetPassword(email: string, newPassword: string) {
  console.log(`🔐 Resetting password for: ${email}`);

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    console.log(`✅ Found user: ${user.fullName} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log(`   Active: ${user.isActive}`);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: true, // Also verify email to allow login
      }
    });

    console.log(`\n✅ Password successfully reset!`);
    console.log(`   Email: ${email}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`   Email Verified: true`);
    console.log(`\n🎯 You can now login with these credentials.`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email and password from command line args
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log("Usage: npx tsx scripts/reset-user-password.ts <email> <new-password>");
  console.log("Example: npx tsx scripts/reset-user-password.ts user@example.com NewPass123!");
  process.exit(1);
}

resetPassword(email, newPassword);
