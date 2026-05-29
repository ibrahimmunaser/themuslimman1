import { prisma } from "./db";

// ─────────────────────────────────────────────────────────────
// Profile limits
// ─────────────────────────────────────────────────────────────

export const INDIVIDUAL_PROFILE_LIMIT = 1;
export const FAMILY_PROFILE_LIMIT     = 5;

/** Subscription statuses that grant full course access. */
export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;

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
 *
 * Pass `sessionHasPaid: true` to skip re-fetching the user.hasPaid column when
 * it was already loaded via getCurrentUser(), saving one DB query per request.
 */
export async function getUserAccessInfo(userId: string, sessionHasPaid?: boolean) {
  const [user, purchase, subscription] = await Promise.all([
    // Skip the hasPaid query if the caller already has it from the session.
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
