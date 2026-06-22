/**
 * Automated payment flow tests — all 4 plans.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * SETUP (one-time)
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * 1. Get Stripe test-mode keys from https://dashboard.stripe.com/test/apikeys
 *    and add them to .env.local:
 *
 *      TEST_STRIPE_SECRET_KEY=sk_test_...
 *      TEST_STRIPE_WEBHOOK_SECRET=whsec_...  ← from: stripe listen --print-secret
 *
 *    (These are SEPARATE from your live STRIPE_SECRET_KEY — never used in prod)
 *
 * 2. Start the dev server in another terminal:
 *      npm run dev
 *
 * 3. In a third terminal, start the Stripe CLI webhook forwarder:
 *      stripe listen --forward-to http://localhost:3000/api/stripe/webhook
 *    (Copy the "whsec_..." it prints and use it as TEST_STRIPE_WEBHOOK_SECRET)
 *
 * 4. Run this script:
 *      npx tsx scripts/test-payments.ts
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHAT IT TESTS
 * ──────────────────────────────────────────────────────────────────────────────
 *   ✅ Individual Lifetime  ($49)   — PI confirmed, webhook delivered, DB verified
 *   ✅ Individual Monthly   ($4.99) — Subscription created + activated, DB verified
 *   ✅ Family Monthly       ($9.99) — Subscription, planType=family, DB verified
 *   ✅ Family Lifetime      ($99)   — PI confirmed, planType=family, DB verified
 *   ✅ Declined card               — Stripe rejects, hasPaid=false, no Purchase row
 *
 * All Stripe objects use TEST mode (tok_visa, tok_chargeDeclined tokens).
 * Zero live charges. Test users cleaned up from DB and Stripe after each run.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import "dotenv/config";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ── Env validation ─────────────────────────────────────────────────────────────

const STRIPE_TEST_KEY =
  process.env.TEST_STRIPE_SECRET_KEY ??
  process.env.STRIPE_SECRET_KEY       ??
  "";
const WEBHOOK_SECRET  =
  process.env.TEST_STRIPE_WEBHOOK_SECRET ??
  process.env.STRIPE_WEBHOOK_SECRET       ??
  "";
const MONTHLY_PRICE_ID        =
  process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY ??
  process.env.STRIPE_MONTHLY_PRICE_ID          ?? "";
const FAMILY_MONTHLY_PRICE_ID =
  process.env.STRIPE_PRICE_FAMILY_MONTHLY      ??
  process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID   ?? "";
const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

if (!STRIPE_TEST_KEY.startsWith("sk_test_")) {
  console.error(
    "\n❌  TEST_STRIPE_SECRET_KEY must be a Stripe test key (sk_test_...).\n" +
    "\n   These tests use Stripe test tokens and CANNOT run with live keys.\n" +
    "   Add to .env.local:\n" +
    "     TEST_STRIPE_SECRET_KEY=sk_test_...\n" +
    "     TEST_STRIPE_WEBHOOK_SECRET=whsec_...\n" +
    "   Get them at: https://dashboard.stripe.com/test/apikeys\n"
  );
  process.exit(1);
}
if (!WEBHOOK_SECRET.startsWith("whsec_")) {
  console.error(
    "\n❌  TEST_STRIPE_WEBHOOK_SECRET not set or invalid.\n" +
    "   Run: stripe listen --print-secret\n" +
    "   Then add TEST_STRIPE_WEBHOOK_SECRET=whsec_... to .env.local\n"
  );
  process.exit(1);
}
if (!MONTHLY_PRICE_ID.startsWith("price_")) {
  console.error("\n❌  STRIPE_PRICE_INDIVIDUAL_MONTHLY not set or invalid.\n");
  process.exit(1);
}
if (!FAMILY_MONTHLY_PRICE_ID.startsWith("price_")) {
  console.error("\n❌  STRIPE_PRICE_FAMILY_MONTHLY not set or invalid.\n");
  process.exit(1);
}

// ── Clients ────────────────────────────────────────────────────────────────────

const stripe = new Stripe(STRIPE_TEST_KEY, { typescript: true });
const prisma  = new PrismaClient();

// ── Helpers ────────────────────────────────────────────────────────────────────

const PASS = "\x1b[32m✅ PASS\x1b[0m";
const FAIL = "\x1b[31m❌ FAIL\x1b[0m";
const INFO = "     \x1b[36mℹ\x1b[0m ";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function createTestUser(email: string, fullName: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.subscription.deleteMany({ where: { userId: existing.id } });
    await prisma.purchase.deleteMany({ where: { userId: existing.id } });
    await prisma.user.update({
      where: { id: existing.id },
      data: { hasPaid: false, planType: "individual", stripeCustomerId: null, updatedAt: new Date() },
    });
    return existing;
  }
  const passwordHash = await bcrypt.hash("TestPass123!", 10);
  return prisma.user.create({
    data: {
      id:            crypto.randomUUID(),
      fullName,
      email,
      passwordHash,
      role:          "student",
      emailVerified: true,
      isActive:      true,
      hasPaid:       false,
      updatedAt:     new Date(),
    },
  });
}

async function deleteTestUser(userId: string) {
  await prisma.subscription.deleteMany({ where: { userId } });
  await prisma.purchase.deleteMany({ where: { userId } });
  await prisma.learnerProfile.deleteMany({ where: { userId } });
  await prisma.studentProfile.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

/**
 * Sign a Stripe event and POST it to the webhook endpoint.
 * Mirrors exactly how the Stripe CLI (and Stripe itself) delivers events.
 */
async function deliverWebhookEvent(event: Stripe.Event): Promise<void> {
  const body      = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const hmac      = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  const sigHeader = `t=${timestamp},v1=${hmac}`;

  const res = await fetch(`${BASE_URL}/api/stripe/webhook`, {
    method:  "POST",
    headers: { "stripe-signature": sigHeader, "content-type": "application/json" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Webhook returned HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
}

function makeEvent(type: string, object: object): Stripe.Event {
  return {
    id:               `evt_test_${crypto.randomUUID().replace(/-/g, "")}`,
    object:           "event",
    type,
    data:             { object: object as Stripe.Event.Data["object"] },
    api_version:      "2026-03-25.dahlia" as Stripe.LatestApiVersion,
    created:          Math.floor(Date.now() / 1000),
    livemode:         false,
    pending_webhooks: 0,
    request:          { id: null, idempotency_key: null },
  } as Stripe.Event;
}

// ── Test runner ────────────────────────────────────────────────────────────────

type Result = { plan: string; status: "pass" | "fail"; detail: string; duration: number };
const results: Result[] = [];

async function runTest(planName: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`  Testing ${planName}... `);
  const start = Date.now();
  try {
    await fn();
    const ms = Date.now() - start;
    console.log(`${PASS} (${ms}ms)`);
    results.push({ plan: planName, status: "pass", detail: "OK", duration: ms });
  } catch (err) {
    const ms = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`${FAIL}`);
    console.log(`     → ${msg}`);
    results.push({ plan: planName, status: "fail", detail: msg, duration: ms });
  }
}

// ── Plan tests ─────────────────────────────────────────────────────────────────

async function testIndividualLifetime(): Promise<void> {
  const email = `autotest_indiv_lt_${Date.now()}@autotest.invalid`;
  const user  = await createTestUser(email, "Test Indiv Lifetime");

  const customer = await stripe.customers.create({ email, metadata: { userId: user.id } });
  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });

  const pm = await stripe.paymentMethods.create({ type: "card", card: { token: "tok_visa" } });
  await stripe.paymentMethods.attach(pm.id, { customer: customer.id });

  const pi = await stripe.paymentIntents.create({
    amount:         4900,
    currency:       "usd",
    customer:       customer.id,
    payment_method: pm.id,
    confirm:        true,
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: { userId: user.id, planId: "complete", planName: "Complete Seerah" },
  });

  assert(pi.status === "succeeded", `PI status=${pi.status}`);
  console.log(`\n${INFO}Stripe PI ${pi.id} → ${pi.status}`);

  await deliverWebhookEvent(makeEvent("payment_intent.succeeded", pi));
  await sleep(500);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  assert(dbUser?.hasPaid === true, `hasPaid=${dbUser?.hasPaid}`);

  const purchase = await prisma.purchase.findFirst({ where: { userId: user.id } });
  assert(purchase !== null, "No Purchase row created");
  assert(purchase!.status === "succeeded", `Purchase.status=${purchase!.status}`);
  assert(purchase!.planId === "complete", `Purchase.planId=${purchase!.planId}`);
  assert(purchase!.amount === 4900, `Purchase.amount=${purchase!.amount} (expected 4900)`);

  console.log(`${INFO}DB ✓ hasPaid=true, planType=${dbUser?.planType}, Purchase.status=succeeded`);

  await deleteTestUser(user.id);
  await stripe.customers.del(customer.id).catch(() => {});
}

async function testIndividualMonthly(): Promise<void> {
  const email = `autotest_indiv_mo_${Date.now()}@autotest.invalid`;
  const user  = await createTestUser(email, "Test Indiv Monthly");

  const customer = await stripe.customers.create({ email, metadata: { userId: user.id } });
  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });

  const pm = await stripe.paymentMethods.create({ type: "card", card: { token: "tok_visa" } });
  await stripe.paymentMethods.attach(pm.id, { customer: customer.id });
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: pm.id },
  });

  const sub = await stripe.subscriptions.create({
    customer:         customer.id,
    items:            [{ price: MONTHLY_PRICE_ID }],
    payment_behavior: "default_incomplete",
    default_payment_method: pm.id,
    payment_settings: {
      payment_method_types: ["card"],
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice", "latest_invoice.payment_intent"],
    metadata: { userId: user.id, planId: "monthly", planType: "individual", type: "subscription" },
  });

  // Confirm the first invoice PI to activate the subscription.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invPi = ((sub.latest_invoice as any)?.payment_intent) as Stripe.PaymentIntent | null;
  if (invPi && invPi.status !== "succeeded") {
    await stripe.paymentIntents.confirm(invPi.id, { payment_method: pm.id });
  }

  await sleep(2500);
  const activeSub = await stripe.subscriptions.retrieve(sub.id, { expand: ["items.data"] });

  assert(
    activeSub.status === "active" || activeSub.status === "trialing",
    `Subscription status=${activeSub.status} (expected active or trialing)`
  );
  console.log(`\n${INFO}Stripe sub ${sub.id} → ${activeSub.status}`);

  await deliverWebhookEvent(makeEvent("customer.subscription.updated", activeSub));
  await sleep(500);

  const dbSub = await prisma.subscription.findFirst({ where: { userId: user.id } });
  assert(dbSub !== null, "No Subscription row created");
  assert(
    dbSub!.status === "active" || dbSub!.status === "trialing",
    `Subscription.status=${dbSub!.status}`
  );
  assert(dbSub!.stripeSubscriptionId === sub.id, "stripeSubscriptionId mismatch");

  console.log(`${INFO}DB ✓ Subscription.status=${dbSub!.status}, stripeSubId matches`);

  await stripe.subscriptions.cancel(sub.id).catch(() => {});
  await deleteTestUser(user.id);
  await stripe.customers.del(customer.id).catch(() => {});
}

async function testFamilyMonthly(): Promise<void> {
  const email = `autotest_family_mo_${Date.now()}@autotest.invalid`;
  const user  = await createTestUser(email, "Test Family Monthly");

  const customer = await stripe.customers.create({ email, metadata: { userId: user.id } });
  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });

  const pm = await stripe.paymentMethods.create({ type: "card", card: { token: "tok_visa" } });
  await stripe.paymentMethods.attach(pm.id, { customer: customer.id });
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: pm.id },
  });

  const sub = await stripe.subscriptions.create({
    customer:         customer.id,
    items:            [{ price: FAMILY_MONTHLY_PRICE_ID }],
    payment_behavior: "default_incomplete",
    default_payment_method: pm.id,
    payment_settings: {
      payment_method_types: ["card"],
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice", "latest_invoice.payment_intent"],
    metadata: { userId: user.id, planId: "familyMonthly", planType: "family", type: "subscription" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invPi = ((sub.latest_invoice as any)?.payment_intent) as Stripe.PaymentIntent | null;
  if (invPi && invPi.status !== "succeeded") {
    await stripe.paymentIntents.confirm(invPi.id, { payment_method: pm.id });
  }

  await sleep(2500);
  const activeSub = await stripe.subscriptions.retrieve(sub.id, { expand: ["items.data"] });

  assert(
    activeSub.status === "active" || activeSub.status === "trialing",
    `Family sub status=${activeSub.status}`
  );
  console.log(`\n${INFO}Stripe family sub ${sub.id} → ${activeSub.status}`);

  await deliverWebhookEvent(makeEvent("customer.subscription.updated", activeSub));
  await sleep(500);

  const dbSub = await prisma.subscription.findFirst({ where: { userId: user.id } });
  assert(dbSub !== null, "No Subscription row created");
  assert(
    dbSub!.status === "active" || dbSub!.status === "trialing",
    `Family Subscription.status=${dbSub!.status}`
  );

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  assert(dbUser?.planType === "family", `planType=${dbUser?.planType} (expected family)`);

  console.log(`${INFO}DB ✓ planType=family, Subscription.status=${dbSub!.status}`);

  await stripe.subscriptions.cancel(sub.id).catch(() => {});
  await deleteTestUser(user.id);
  await stripe.customers.del(customer.id).catch(() => {});
}

async function testFamilyLifetime(): Promise<void> {
  const email = `autotest_family_lt_${Date.now()}@autotest.invalid`;
  const user  = await createTestUser(email, "Test Family Lifetime");

  const customer = await stripe.customers.create({ email, metadata: { userId: user.id } });
  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });

  const pm = await stripe.paymentMethods.create({ type: "card", card: { token: "tok_visa" } });
  await stripe.paymentMethods.attach(pm.id, { customer: customer.id });

  const pi = await stripe.paymentIntents.create({
    amount:         9900,
    currency:       "usd",
    customer:       customer.id,
    payment_method: pm.id,
    confirm:        true,
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: { userId: user.id, planId: "family", planName: "Family Access", planType: "family" },
  });

  assert(pi.status === "succeeded", `Family lifetime PI status=${pi.status}`);
  console.log(`\n${INFO}Stripe family PI ${pi.id} → ${pi.status}`);

  await deliverWebhookEvent(makeEvent("payment_intent.succeeded", pi));
  await sleep(500);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  assert(dbUser?.hasPaid === true, `hasPaid=${dbUser?.hasPaid}`);
  assert(dbUser?.planType === "family", `planType=${dbUser?.planType} (expected family)`);

  const purchase = await prisma.purchase.findFirst({ where: { userId: user.id } });
  assert(purchase !== null, "No Purchase row created");
  assert(purchase!.status === "succeeded", `Purchase.status=${purchase!.status}`);
  assert(purchase!.planId === "family", `Purchase.planId=${purchase!.planId}`);
  assert(purchase!.amount === 9900, `Purchase.amount=${purchase!.amount} (expected 9900)`);

  console.log(`${INFO}DB ✓ hasPaid=true, planType=family, Purchase.amount=9900`);

  await deleteTestUser(user.id);
  await stripe.customers.del(customer.id).catch(() => {});
}

async function testDeclinedCard(): Promise<void> {
  const email = `autotest_declined_${Date.now()}@autotest.invalid`;
  const user  = await createTestUser(email, "Test Declined");

  const customer = await stripe.customers.create({ email, metadata: { userId: user.id } });
  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });

  const pm = await stripe.paymentMethods.create({
    type: "card",
    card: { token: "tok_chargeDeclined" },
  });
  await stripe.paymentMethods.attach(pm.id, { customer: customer.id });

  let stripeRejected = false;
  try {
    await stripe.paymentIntents.create({
      amount:         4900,
      currency:       "usd",
      customer:       customer.id,
      payment_method: pm.id,
      confirm:        true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { userId: user.id, planId: "complete" },
    });
  } catch (err) {
    const e = err as Stripe.StripeError;
    if (e.type === "StripeCardError" || e.code === "card_declined") {
      stripeRejected = true;
      console.log(`\n${INFO}Stripe declined: ${e.message}`);
    } else {
      throw err;
    }
  }

  assert(stripeRejected, "Declined card was not rejected by Stripe");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  assert(dbUser?.hasPaid !== true, `hasPaid=true after decline — access incorrectly granted`);

  const purchase = await prisma.purchase.findFirst({ where: { userId: user.id } });
  assert(purchase === null, `Purchase row exists after decline: status=${purchase?.status}`);

  console.log(`${INFO}DB ✓ hasPaid=false, no Purchase row`);

  await deleteTestUser(user.id);
  await stripe.customers.del(customer.id).catch(() => {});
}

// ── Server health check ────────────────────────────────────────────────────────

async function checkServerRunning(): Promise<void> {
  try {
    await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(4000) });
  } catch {
    console.error(
      `\n❌  Cannot reach ${BASE_URL}\n` +
      "   Start the dev server first:\n" +
      "     npm run dev\n"
    );
    process.exit(1);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
  console.log("\x1b[1m  Seerah — Automated Payment Flow Test Suite\x1b[0m");
  console.log("\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
  console.log(`  Stripe key:    ${STRIPE_TEST_KEY.slice(0, 16)}...`);
  console.log(`  Monthly price: ${MONTHLY_PRICE_ID}`);
  console.log(`  Family price:  ${FAMILY_MONTHLY_PRICE_ID}`);
  console.log(`  Server:        ${BASE_URL}`);
  console.log("\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n");

  await checkServerRunning();

  await runTest("Individual Lifetime  ($49 one-time)", testIndividualLifetime);
  await runTest("Individual Monthly   ($4.99/month)",  testIndividualMonthly);
  await runTest("Family Monthly       ($9.99/month)",  testFamilyMonthly);
  await runTest("Family Lifetime      ($99 one-time)", testFamilyLifetime);
  await runTest("Declined card        (no access)",    testDeclinedCard);

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;

  console.log("\n\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
  console.log("\x1b[1m  Results\x1b[0m");
  console.log("\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");

  for (const r of results) {
    const icon = r.status === "pass" ? PASS : FAIL;
    console.log(`  ${icon}  ${r.plan.padEnd(36)} ${r.duration}ms`);
    if (r.status === "fail") console.log(`         \x1b[31m${r.detail}\x1b[0m`);
  }

  console.log("\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
  if (failed === 0) {
    console.log(`  \x1b[32m\x1b[1mAll ${passed} tests passed.\x1b[0m`);
  } else {
    console.log(`  \x1b[32m${passed} passed\x1b[0m  \x1b[31m${failed} failed\x1b[0m`);
  }
  console.log("\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n");

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("\nUnhandled error:", err);
  prisma.$disconnect().finally(() => process.exit(1));
});
