import { prisma } from "@/lib/db";

/**
 * Fetch all succeeded purchases attributed to a creator.
 *
 * Primary match:   Purchase.creator = creator  (set by Stripe metadata / webhook)
 * Fallback match:  A `payment_succeeded` InfluencerEvent was recorded for THIS
 *                  creator with the user's email.  This event fires at the moment
 *                  of payment and carries the exact creator that drove the session,
 *                  so it is safe to use without risking cross-influencer pollution.
 *
 * Duplicates are removed so a purchase that matches both criteria is counted once.
 */
export async function getInfluencerPurchases(creator: string) {
  // Only use emails from `payment_succeeded` events — fired once, for the exact
  // creator that was active in the checkout session.
  const emailRows = await prisma.influencerEvent.findMany({
    where:  { creator, eventType: "payment_succeeded", userEmail: { not: null } },
    select: { userEmail: true },
    distinct: ["userEmail"],
  });
  const trackedEmails = emailRows
    .map((r) => r.userEmail as string)
    .filter(Boolean);

  const rows = await prisma.purchase.findMany({
    where: {
      status: "succeeded",
      OR: [
        { creator },
        ...(trackedEmails.length > 0
          ? [{ user: { email: { in: trackedEmails } } }]
          : []),
      ],
    },
    select: {
      id: true, amount: true, createdAt: true, promoCode: true,
      user: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Deduplicate by purchase id (the OR can return the same row twice).
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

/**
 * Fetch all subscriptions attributed to a creator, with the same
 * payment_succeeded-scoped email fallback as getInfluencerPurchases.
 */
export async function getInfluencerSubscriptions(creator: string) {
  const emailRows = await prisma.influencerEvent.findMany({
    where:  { creator, eventType: "payment_succeeded", userEmail: { not: null } },
    select: { userEmail: true },
    distinct: ["userEmail"],
  });
  const trackedEmails = emailRows
    .map((r) => r.userEmail as string)
    .filter(Boolean);

  const rows = await prisma.subscription.findMany({
    where: {
      OR: [
        { creator },
        ...(trackedEmails.length > 0
          ? [{ user: { email: { in: trackedEmails } } }]
          : []),
      ],
    },
    select: {
      id: true, createdAt: true, promoCode: true,
      user: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}
