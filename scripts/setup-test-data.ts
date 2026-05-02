/**
 * Setup Test Data - Create test users with purchases
 * 
 * This script:
 * 1. Creates or updates test student accounts
 * 2. Sets known passwords for easy testing
 * 3. Creates successful purchases for testing the dashboard
 * 
 * Run with: npx tsx scripts/setup-test-data.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    username: "imunaser",
    fullName: "Ibrahim Munaser",
    email: "imunaser@test.com",
    password: "test123",
    planId: "complete",
    planName: "Complete Seerah Academy",
  },
  {
    username: "imunaser1",
    fullName: "Ibrahim Munaser",
    email: "imunaser1@test.com",
    password: "test123",
    planId: "essentials",
    planName: "Seerah Essentials",
  },
  {
    username: "imunaser2",
    fullName: "Ibrahim Munaser",
    email: "imunaser2@test.com",
    password: "test123",
    planId: "complete",
    planName: "Complete Seerah Academy",
  },
];

async function main() {
  console.log("→ Setting up test data...\n");

  for (const testUser of TEST_USERS) {
    console.log(`Processing ${testUser.username}...`);

    const user = await prisma.user.findFirst({
      where: { username: testUser.username },
    });

    if (!user) {
      console.log(`  ⚠ User ${testUser.username} not found, skipping`);
      continue;
    }

    const passwordHash = await bcrypt.hash(testUser.password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    console.log(`  ✓ Password updated`);

    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: user.id,
        status: "succeeded",
      },
    });

    if (existingPurchase) {
      console.log(`  ✓ Purchase already exists (${existingPurchase.planId})`);
    } else {
      const amount = testUser.planId === "complete" ? 9700 : 4700;
      await prisma.purchase.create({
        data: {
          id: nanoid(),
          userId: user.id,
          planId: testUser.planId,
          planName: testUser.planName,
          amount,
          currency: "usd",
          status: "succeeded",
          stripePaymentIntentId: `pi_test_${nanoid()}`,
        },
      });
      console.log(`  ✓ Purchase created (${testUser.planId} - $${amount / 100})`);
    }
  }

  console.log("\n✓ Test data setup complete!\n");
  console.log("Test Credentials:");
  console.log("================");
  TEST_USERS.forEach((u) => {
    console.log(`Username: ${u.username} | Password: ${u.password} | Plan: ${u.planId}`);
  });
  console.log("\nYou can now sign in at: http://localhost:3000/login\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
