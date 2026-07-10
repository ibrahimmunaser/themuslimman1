import { prisma } from "./db";

// ─────────────────────────────────────────────────────────────
// Profile limits
// ─────────────────────────────────────────────────────────────

export const INDIVIDUAL_PROFILE_LIMIT = 1;
export const FAMILY_PROFILE_LIMIT     = 5;

/**
 * Subscription statuses that grant full course access when paired with an
 * appropriate time-based guard (see hasActiveCourseAccess for the full logic).
 *
 * "past_due" is included for display/admin queries.
 *
 * ── Policy note (verified against live Stripe data on a real past_due row) ──
 * Stripe API 2026-04-22.dahlia advances `current_period_end` to the next
 * billing date as soon as a renewal invoice is generated — BEFORE payment
 * succeeds or fails. So currentPeriodEnd alone was never a broken/stale guard
 * for past_due rows; it would have continued granting access for the entire
 * next billing cycle (~30 days) while a renewal silently failed.
 *
 * gracePeriodEndsAt is an intentional POLICY CHANGE, not a bug fix: it
 * deliberately shortens that implicit ~30-day access window down to a much
 * tighter, explicit, auditable grace period (default 7 days, configurable via
 * SUBSCRIPTION_GRACE_PERIOD_DAYS) so failed renewals lose access quickly
 * instead of riding out the full billing cycle on a card that isn't working.
 */
export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"] as const;

/**
 * Access matrix:
 *
 *  active + currentPeriodEnd >= now          → ACCESS
 *  trialing + currentPeriodEnd >= now         → ACCESS
 *  past_due + gracePeriodEndsAt >= now        → ACCESS with billing warning
 *  past_due + gracePeriodEndsAt null/expired  → NO COURSE ACCESS (billing recovery only)
 *  incomplete / incomplete_expired / unpaid / paused / canceled → NO ACCESS
 *  lifetime Purchase (hasPaid=true or Purchase.status=succeeded)  → ACCESS (unaffected by subscription)
 *  verified mobile purchases (MobilePurchase.status=active)       → ACCESS (unaffected by subscription)
 *
 * Returns true if the user has active course access via any of:
 * 1. A lifetime one-time purchase (Purchase.status = "succeeded"), OR
 * 2. user.hasPaid = true (covers gifted users whose claim didn't create a Purchase row), OR
 * 3. An active/trialing Stripe subscription with a future currentPeriodEnd, OR
 * 4. A past_due subscription within an explicit grace window (gracePeriodEndsAt >= now), OR
 * 5. An active Apple/Google IAP purchase.
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
        OR: [
          // Active / trialing: currentPeriodEnd is a reliable guard against a
          // stale/out-of-order webhook — Stripe advances it on every renewal.
          {
            status: { in: ["active", "trialing"] },
            currentPeriodEnd: { gte: now },
          },
          // Past-due (failed renewal): grant access only during the explicit
          // grace window set by handleInvoicePaymentFailed on the FIRST failure
          // of a given invoice. This is a deliberate policy choice to cut access
          // much sooner than the ~30 days currentPeriodEnd would otherwise allow
          // (see policy note above ACTIVE_SUBSCRIPTION_STATUSES).
          // Once retries are exhausted, Stripe transitions the subscription to
          // canceled or unpaid (verified Revenue Recovery setting — see
          // docs/STRIPE_RENEWAL_FAILURE.md) and this branch stops matching.
          {
            status: "past_due",
            gracePeriodEndsAt: { gte: now },
          },
        ],
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
      where: { userId, status: { not: "canceled" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        stripeSubscriptionId: true,
        gracePeriodEndsAt: true,
        renewalAttemptCount: true,
        lastPaymentFailedAt: true,
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

  // Determine if the Stripe subscription grants access, per the access matrix above.
  // past_due intentionally uses gracePeriodEndsAt (policy: 7-day window) instead of
  // currentPeriodEnd (which Stripe already advanced to the next cycle regardless of
  // whether the renewal succeeded).
  const subStatus = subscription?.status ?? "";
  const hasActiveStripeSubscription = (() => {
    if (!subscription) return false;
    if (subStatus === "active" || subStatus === "trialing") {
      return subscription.currentPeriodEnd > now;
    }
    if (subStatus === "past_due") {
      return !!(subscription.gracePeriodEndsAt && subscription.gracePeriodEndsAt > now);
    }
    return false;
  })();

  const hasActiveSubscription =
    hasActiveStripeSubscription || mobilePurchase?.purchaseType === "subscription";

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
 * Safety-net ceiling for the past_due checkout guard (see getActiveSubscription).
 *
 * We rely on Stripe's Revenue Recovery / dunning configuration to eventually
 * transition an exhausted past_due subscription to `canceled` or `unpaid`,
 * at which point getActiveSubscription naturally stops blocking new checkout.
 * That Dashboard setting is NOT readable via the Stripe API (verified by
 * direct API probing — see docs/STRIPE_RENEWAL_FAILURE.md) and, as of this
 * writing, no subscription in this account has yet completed a full dunning
 * cycle to exhaustion, so there is no empirical webhook evidence confirming
 * the final state either.
 *
 * To guarantee a user is NEVER stuck unable to resubscribe — even if the
 * Dashboard is misconfigured to leave subscriptions past_due indefinitely, or
 * a final webhook is somehow missed — the checkout guard stops blocking once
 * lastPaymentFailedAt is older than this ceiling, regardless of Stripe status.
 * This is intentionally far longer than the 7-day course-access grace period
 * (which is unaffected by this constant) and longer than Stripe's typical
 * smart-retry window (~3–4 weeks), so it only ever engages as a last resort.
 */
export const STALE_PAST_DUE_CEILING_DAYS = parseInt(
  process.env.STALE_PAST_DUE_CEILING_DAYS ?? "45",
  10,
);

/**
 * Returns the user's current active subscription row if one exists, or null
 * if there is no subscription that should block creating a new one.
 *
 * Used as the server-side gate in subscription checkout APIs to prevent
 * creating a second concurrent subscription.
 *
 * Rules:
 *  - active / trialing (with future currentPeriodEnd): always block.
 *  - past_due (within grace window): block and direct to update-payment flow.
 *  - past_due (expired / null grace): still block — the subscription is still
 *    open in Stripe and the user should use the Stripe portal to resolve it.
 *    Once Stripe finalises the sub (cancels or marks unpaid) the user can
 *    subscribe again freely.
 *  - past_due older than STALE_PAST_DUE_CEILING_DAYS: stop blocking (safety
 *    net — see constant doc above). Course access is still denied by
 *    hasActiveCourseAccess regardless; this only affects the checkout guard.
 *  - canceled / unpaid / incomplete*: not returned — user may create a new sub.
 */
export async function getActiveSubscription(userId: string) {
  const now = new Date();
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      OR: [
        { status: { in: ["active", "trialing"] }, currentPeriodEnd: { gte: now } },
        { status: "past_due" },  // blocked regardless of grace; direct to /billing
      ],
    },
    select: {
      id: true,
      stripeSubscriptionId: true,
      status: true,
      currentPeriodEnd: true,
      gracePeriodEndsAt: true,
      lastPaymentFailedAt: true,
    },
  });

  if (sub?.status === "past_due" && sub.lastPaymentFailedAt) {
    const ceiling = new Date(
      sub.lastPaymentFailedAt.getTime() + STALE_PAST_DUE_CEILING_DAYS * 24 * 60 * 60 * 1000,
    );
    if (ceiling < now) {
      // Safety net engaged — Stripe never finalized this subscription within
      // a generous window. Do not block resubscription indefinitely.
      return null;
    }
  }

  return sub;
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
