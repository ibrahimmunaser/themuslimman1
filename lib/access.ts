import { prisma } from "./db";

/** Subscription statuses that grant full course access. */
export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;

/**
 * Returns true if the user has active course access via either:
 * 1. A lifetime one-time purchase (Purchase.status = "succeeded"), OR
 * 2. user.hasPaid = true (covers gifted users whose claim didn't create a Purchase row), OR
 * 3. An active/trialing monthly subscription.
 */
export async function hasActiveCourseAccess(userId: string): Promise<boolean> {
  const [user, purchase, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { hasPaid: true } }),
    prisma.purchase.findFirst({
      where: { userId, status: "succeeded" },
      select: { id: true },
    }),
    prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: [...ACTIVE_SUBSCRIPTION_STATUSES] },
      },
      select: { id: true },
    }),
  ]);

  return !!(user?.hasPaid || purchase || subscription);
}

/**
 * Returns detailed access info for a user: what type of access they have.
 */
export async function getUserAccessInfo(userId: string) {
  const [user, purchase, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { hasPaid: true } }),
    prisma.purchase.findFirst({
      where: { userId, status: "succeeded" },
      select: { id: true, planId: true, createdAt: true },
    }),
    prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        stripeSubscriptionId: true,
      },
    }),
  ]);

  // hasPaid covers users who claimed a gift (no Purchase row) as well as normal buyers
  const hasLifetime = !!(user?.hasPaid || purchase);
  const hasActiveSubscription =
    !!subscription && (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(subscription.status);

  return {
    hasAccess: hasLifetime || hasActiveSubscription,
    hasLifetime,
    hasActiveSubscription,
    subscription: subscription ?? null,
    lifetimePurchase: purchase ?? null,
  };
}
