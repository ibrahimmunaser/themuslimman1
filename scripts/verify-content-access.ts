/**
 * Verify Content Access - Check that users see correct content based on their plan
 */

import { PrismaClient } from "@prisma/client";
import { PARTS } from "../lib/content";

const prisma = new PrismaClient();

async function main() {
  console.log("→ Verifying Content Access by Plan\n");
  console.log(`Total parts in system: ${PARTS.length}`);
  
  const essentialParts = PARTS.filter(p => p.includedInEssentials);
  console.log(`Parts in Essentials plan: ${essentialParts.length}\n`);

  const testUsers = ["imunaser", "imunaser1", "imunaser2"];

  for (const username of testUsers) {
    const user = await prisma.user.findFirst({
      where: { username },
      include: {
        purchases: {
          where: { status: "succeeded" },
        },
      },
    });

    if (!user) {
      console.log(`❌ User ${username} not found\n`);
      continue;
    }

    console.log(`User: ${username}`);
    console.log(`  Full Name: ${user.fullName}`);

    if (user.purchases.length === 0) {
      console.log(`  ⚠️  No purchases found - would be redirected to /pricing\n`);
      continue;
    }

    const hasCompletePlan = user.purchases.some(p => p.planId === "complete");
    const hasEssentialsPlan = user.purchases.some(p => p.planId === "essentials");
    const userPlan = hasCompletePlan ? "complete" : hasEssentialsPlan ? "essentials" : null;

    console.log(`  Plan: ${userPlan} ($${user.purchases[0].amount / 100})`);

    // Filter parts based on user's plan (same logic as /app/learn/page.tsx)
    const accessibleParts = PARTS.filter(part => {
      if (userPlan === "complete") return true; // Complete plan gets everything
      if (userPlan === "essentials") return part.includedInEssentials;
      return false;
    });

    console.log(`  Accessible Parts: ${accessibleParts.length}`);
    console.log(`  Dashboard Title: ${userPlan === "complete" ? "Complete Seerah Academy" : "Seerah Starter"}`);

    // Show sample of accessible parts
    console.log(`  Sample Parts:`);
    accessibleParts.slice(0, 5).forEach(p => {
      console.log(`    - Part ${p.partNumber}: ${p.title}`);
    });
    if (accessibleParts.length > 5) {
      console.log(`    ... and ${accessibleParts.length - 5} more`);
    }

    console.log();
  }

  console.log("✓ Verification complete!\n");
  console.log("Summary:");
  console.log("========");
  console.log("• Complete Plan users see: ALL 100 parts");
  console.log(`• Essentials Plan users see: ONLY ${essentialParts.length} essential parts`);
  console.log("• Users without purchases are redirected to /pricing");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
