import { prisma } from "@/lib/db";

/**
 * Fetch all succeeded purchases attributed to a creator.
 *
 * Primary match:   Purchase.creator = creator  (set by Stripe metadata / webhook)
 * Fallback match:  Purchase.user.email appears in any InfluencerEvent for this
 *                  creator (covers purchases made before the server-side creator
 *                  attribution was wired up, as long as the checkout tracker
 *                  fired a payment_succeeded event with the user's email).
 *
 * Duplicates are removed so a purchase that matches both criteria is counted once.
 */
export async function getInfluencerPurchases(creator: string) {
  // Collect every distinct email that appeared in a funnel event for this creator.
  const emailRows = await prisma.influencerEvent.findMany({
    where:  { creator, userEmail: { not: null } },
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
 * email-based fallback as getInfluencerPurchases.
 */
export async function getInfluencerSubscriptions(creator: string) {
  const emailRows = await prisma.influencerEvent.findMany({
    where:  { creator, userEmail: { not: null } },
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
