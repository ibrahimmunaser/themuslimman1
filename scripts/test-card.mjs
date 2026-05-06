import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const envLocal = readFileSync(".env.local", "utf8");
const stripeKey = envLocal.match(/STRIPE_SECRET_KEY="?([^"\n]+)"?/)?.[1]?.trim().replace(/"/g, "");

const envMain = readFileSync(".env", "utf8");
const dbUrl = envMain.match(/DATABASE_URL="?([^"\n]+)"?/)?.[1]?.trim().replace(/"/g, "");

console.log("Stripe key prefix:", stripeKey?.slice(0, 12));

const stripe = new Stripe(stripeKey);
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

const [,, action] = process.argv;

async function findUser() {
  const users = await prisma.user.findMany({
    where: { hasPaid: true },
    select: { id: true, email: true, stripeCustomerId: true, fullName: true },
    take: 3,
  });
  console.log("Paid users:", users.map(u => `${u.email} (customerId: ${u.stripeCustomerId})`).join("\n"));
  return users[0];
}

async function getOrCreateCustomer(user) {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const cust = await stripe.customers.create({ email: user.email, name: user.fullName ?? "", metadata: { userId: user.id } });
  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: cust.id } });
  console.log("Created customer:", cust.id);
  return cust.id;
}

// STEP 1: Add test Visa card
async function addCard() {
  const user = await findUser();
  const customerId = await getOrCreateCustomer(user);

  const pm = await stripe.paymentMethods.create({ type: "card", card: { token: "tok_visa" } });
  console.log("Created PM:", pm.id, pm.card?.brand, pm.card?.last4, "fingerprint:", pm.card?.fingerprint);

  const { data: existing } = await stripe.paymentMethods.list({ customer: customerId, type: "card" });
  if (existing.some(e => e.card?.fingerprint === pm.card?.fingerprint)) {
    await stripe.paymentMethods.detach(pm.id);
    console.log("DUPLICATE — card already saved. Existing cards:");
    existing.forEach(c => console.log(" ", c.card?.brand, c.card?.last4, c.id));
    return;
  }

  await stripe.paymentMethods.attach(pm.id, { customer: customerId });
  console.log("✅ Card attached!");

  const { data: after } = await stripe.paymentMethods.list({ customer: customerId, type: "card" });
  console.log("Cards on customer now:", after.map(c => `${c.card?.brand} ****${c.card?.last4} (${c.id})`).join(", "));
}

// STEP 2: Remove the card
async function removeCard() {
  const user = await findUser();
  if (!user.stripeCustomerId) { console.log("No customer"); return; }

  const { data } = await stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: "card" });
  if (data.length === 0) { console.log("No cards to remove"); return; }

  const pm = data[0];
  console.log("Removing:", pm.card?.brand, pm.card?.last4, pm.id);
  await stripe.paymentMethods.detach(pm.id);
  console.log("✅ Card removed!");

  const { data: after } = await stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: "card" });
  console.log("Cards remaining:", after.length === 0 ? "none" : after.map(c => `${c.card?.brand} ****${c.card?.last4}`).join(", "));
}

// STEP 3: List cards
async function listCards() {
  const user = await findUser();
  if (!user.stripeCustomerId) { console.log("No customer yet"); return; }
  const { data } = await stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: "card" });
  console.log("Saved cards:", data.length === 0 ? "none" : data.map(c => `${c.card?.brand} ****${c.card?.last4} (${c.id})`).join(", "));
}

try {
  if (action === "add") await addCard();
  else if (action === "remove") await removeCard();
  else await listCards();
} finally {
  await prisma.$disconnect();
}
