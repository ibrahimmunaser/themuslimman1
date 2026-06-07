import { prisma } from "./db";

// ─────────────────────────────────────────────────────────────
// Profile limits
// ─────────────────────────────────────────────────────────────

export const INDIVIDUAL_PROFILE_LIMIT = 1;
export const FAMILY_PROFILE_LIMIT     = 5;

/**
 * Subscription statuses that grant full course access.
 *
 * "past_due" is included intentionally: when Stripe's Smart Retries are running
 * (after a failed renewal payment), the subscription status is "past_due" while
 * Stripe keeps trying to collect over several days. Revoking access immediately
 * on the first retry would be too harsh — the user should retain access until
 * the subscription is fully cancelled (status = "canceled") after all retries fail.
 *
 * The `currentPeriodEnd: { gte: now }` guard in hasActiveCourseAccess acts as a
 * safety net: once the billing period expires and Stripe cancels the subscription
 * (firing customer.subscription.deleted → our handler sets status = "canceled"),
 * the past_due row will no longer match and access will be correctly denied.
 */
export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"] as const;

/**
 * Returns true if the user has active course access via either:
 * 1. A lifetime one-time purchase (Purchase.status = "succeeded"), OR
 * 2. user.hasPaid = true (covers gifted users whose claim didn't create a Purchase row), OR
 * 3. An active/trialing monthly subscription.
 *
 * Pass `sessionHasPaid: true` when the caller already loaded hasPaid from the
 * session (via getCurrentUser) to skip the user-row DB query and short-circuit
 * immediately for lifetime buyers — saving one DB round-trip per page load.
 */
export async function hasActiveCourseAccess(
  userId: string,
  sessionHasPaid?: boolean,
): Promise<boolean> {
  // Fast path: lifetime buyer confirmed by session data — no DB needed.
  if (sessionHasPaid) return true;

  const now = new Date();

  const [user, purchase, subscription, mobilePurchase] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { hasPaid: true } }),
    prisma.purchase.findFirst({
      where: { userId, status: "succeeded" },
      select: { id: true },
    }),
    prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: [...ACTIVE_SUBSCRIPTION_STATUSES] },
        // Guard against stale "active" rows when Stripe fails to deliver webhooks.
        currentPeriodEnd: { gte: now },
      },
      select: { id: true },
    }),
    // Apple / Google purchases (lifetime or active subscription)
    prisma.mobilePurchase.findFirst({
      where: {
        userId,
        status: "active",
        OR: [
          { purchaseType: "lifetime" },
          { purchaseType: "subscription", currentPeriodEnd: { gte: now } },
        ],
      },
      select: { id: true },
    }),
  ]);

  return !!(user?.hasPaid || purchase || subscription || mobilePurchase);
}

/**
 * Returns detailed access info for a user: what type of access they have.
 *
 * Pass `sessionHasPaid: true` to skip re-fetching the user.hasPaid column when
 * it was already loaded via getCurrentUser(), saving one DB query per request.
 */
export async function getUserAccessInfo(userId: string, sessionHasPaid?: boolean) {
  const now = new Date();

  const [user, purchase, subscription, mobilePurchase] = await Promise.all([
    sessionHasPaid
      ? Promise.resolve({ hasPaid: true })
      : prisma.user.findUnique({ where: { id: userId }, select: { hasPaid: true } }),
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
    prisma.mobilePurchase.findFirst({
      where: {
        userId,
        status: "active",
        OR: [
          { purchaseType: "lifetime" },
          { purchaseType: "subscription", currentPeriodEnd: { gte: now } },
        ],
      },
      select: { id: true, platform: true, productId: true, purchaseType: true, currentPeriodEnd: true },
    }),
  ]);

  const hasLifetime = !!(user?.hasPaid || purchase || mobilePurchase?.purchaseType === "lifetime");
  const hasActiveSubscription =
    (!!subscription && (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(subscription.status)) ||
    (mobilePurchase?.purchaseType === "subscription");

  return {
    hasAccess: hasLifetime || hasActiveSubscription,
    hasLifetime,
    hasActiveSubscription,
    subscription: subscription ?? null,
    lifetimePurchase: purchase ?? null,
    mobilePurchase: mobilePurchase ?? null,
  };
}

/**
 * Returns the user's current active subscription row if one exists,
 * or null if there is no active/trialing subscription with a non-expired period.
 *
 * Used as the server-side gate in subscription checkout APIs to prevent
 * users from creating a second concurrent monthly subscription.
 */
export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: [...ACTIVE_SUBSCRIPTION_STATUSES] },
      currentPeriodEnd: { gte: new Date() },
    },
    select: {
      id: true,
      stripeSubscriptionId: true,
      status: true,
      currentPeriodEnd: true,
    },
  });
}

/**
 * Returns the maximum number of learner profiles allowed for a user.
 * Family plan = 5 profiles; everything else = 1 profile.
 */
export function getProfileLimit(planType: string): number {
  return planType === "family" ? FAMILY_PROFILE_LIMIT : INDIVIDUAL_PROFILE_LIMIT;
}

/**
 * Returns true when the user's planType grants Family Access.
 */
export function isFamilyPlan(planType: string): boolean {
  return planType === "family";
}
