/**
 * cancel-old-incomplete-subs.mjs
 *
 * Finds all DB subscriptions with status=incomplete that use an old price ID,
 * cancels them in Stripe, and marks them canceled in the DB.
 *
 * Safe to run multiple times — idempotent.
 * Run: npx tsx scripts/cancel-old-incomplete-subs.mjs [--dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const DRY_RUN = process.argv.includes("--dry-run");
const OLD_PRICE_IDS = new Set([
  "price_1TZlfJICehG6x31hOcioQzX3", // old individual monthly
  "price_1Tc9MkICehG6x31hl4MRyda3", // old family monthly
]);

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });

const subs = await prisma.subscription.findMany({
  where: { status: "incomplete" },
  select: {
    id: true,
    stripeSubscriptionId: true,
    stripePriceId: true,
    userId: true,
    createdAt: true,
  },
});

const stale = subs.filter((s) => OLD_PRICE_IDS.has(s.stripePriceId));
console.log(`Found ${subs.length} incomplete subscriptions, ${stale.length} with old price IDs.`);

if (stale.length === 0) {
  console.log("Nothing to do.");
  await prisma.$disconnect();
  process.exit(0);
}

for (const sub of stale) {
  console.log(`\n[${sub.stripeSubscriptionId}] userId=${sub.userId} price=${sub.stripePriceId} created=${sub.createdAt.toISOString()}`);
  if (DRY_RUN) {
    console.log("  DRY RUN — would cancel");
    continue;
  }

  try {
    await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    console.log("  ✓ Canceled in Stripe");
  } catch (e) {
    // Already canceled or expired — still mark DB
    console.warn("  Stripe cancel failed (may already be expired):", e.message);
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "canceled", updatedAt: new Date() },
  });
  console.log("  ✓ Marked canceled in DB");
}

console.log(`\nDone. ${DRY_RUN ? "(dry run)" : ""}`);
await prisma.$disconnect();
