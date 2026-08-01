import { prisma } from "./db";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Profile limits
// ─────────────────────────────────────────────────────────────

export const INDIVIDUAL_PROFILE_LIMIT = 1;
export const FAMILY_PROFILE_LIMIT     = 5;

/**
 * Total number of parts in the Seerah course. Single source of truth for
 * the web app — mirrors the mobile app's `PARTS.length`
 * (seerah-mobile/seerah_app/lib/core/data/parts_data.dart). Previously this
 * was hardcoded independently as `100` in multiple places (certificate page,
 * profile-progress summary), which would have silently gone stale if the
 * course's part count ever changed.
 */
export const TOTAL_COURSE_PARTS: number = 100;

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
 * ── MobilePurchase.currentPeriodEnd freshness (Audit H8 — resolved) ──
 * As of 2026-07-30, App Store Server Notifications V2 (Apple) and Real-time
 * Developer Notifications (Google) webhooks are wired up at
 * /api/webhooks/apple-notifications and /api/webhooks/google-play-notifications
 * respectively. Refunds and Family Sharing revocations now flip
 * MobilePurchase.status away from "active" (and clear currentPeriodEnd)
 * the moment Apple/Google tell us, regardless of whether the app is open —
 * closing the "refunded user keeps access forever" gap. Renewals (DID_RENEW /
 * SUBSCRIPTION_RENEWED) also refresh currentPeriodEnd server-side as a bonus,
 * on top of the pre-existing client-side mitigations in IAPNotifier (purchase
 * stream observer attached at app startup so the OS replays queued
 * transactions).
 * Remaining gap: webhook delivery requires the URLs above to actually be
 * registered in App Store Connect (App Information → App Store Server
 * Notifications) and Play Console (Monetization setup → Real-time developer
 * notifications) + a Cloud Pub/Sub push subscription — see the comments atop
 * each webhook route for the exact external setup steps. Until registered,
 * this reduces to the previous client-driven-only behavior.
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
      // Prefer the most recently verified mobile entitlement when multiple
      // active rows exist (e.g. lifetime + leftover sub) so purchasePlatform
      // routing is deterministic.
      orderBy: { verifiedAt: "desc" },
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

  // Prefer Stripe when it is actively granting access so "Manage Subscription"
  // routes to the Stripe portal rather than Play/App Store (dual-platform users
  // who bought on web then also have a leftover mobile row). Use mobile only
  // when mobile is the sole grant.
  const stripeGrantsAccess = !!purchase || hasActiveStripeSubscription;
  const mobileGrantsAccess = !!mobilePurchase;
  const purchasePlatform: "stripe" | "google" | "apple" | null = (() => {
    if (!(hasLifetime || hasActiveSubscription)) return null;
    if (stripeGrantsAccess) return "stripe";
    if (mobileGrantsAccess) {
      const p = mobilePurchase!.platform;
      if (p === "google" || p === "apple") return p;
    }
    // Legacy hasPaid with no traceable purchase row.
    return "stripe";
  })();

  return {
    hasAccess: hasLifetime || hasActiveSubscription,
    hasLifetime,
    hasActiveSubscription,
    hasActiveStripeSubscription,
    purchasePlatform,
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
 *  - unpaid: block like past_due — open Stripe subscription still needs portal recovery.
 *  - canceled / incomplete*: not returned — user may create a new sub.
 */
export async function getActiveSubscription(userId: string) {
  const now = new Date();
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      OR: [
        { status: { in: ["active", "trialing"] }, currentPeriodEnd: { gte: now } },
        { status: { in: ["past_due", "unpaid"] } },
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

  if (
    (sub?.status === "past_due" || sub?.status === "unpaid") &&
    sub.lastPaymentFailedAt
  ) {
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
 * Max length allowed for a LearnerProfile.avatar value. Both avatar pickers
 * (web: app/student/profiles/profiles-client.tsx, mobile:
 * profiles_screen.dart) only ever offer single-emoji choices, but emoji can
 * legitimately be multi-codepoint UTF-16 sequences (ZWJ family/skin-tone
 * modifiers, flag sequences, etc.) — 32 is generous headroom above any real
 * emoji (which top out well under 20 UTF-16 code units) while still
 * rejecting a client sending something absurd.
 */
export const MAX_AVATAR_LENGTH = 32;

/**
 * Validates a LearnerProfile.avatar value before it's persisted.
 *
 * Audit M-avatar-validate: create/update profile endpoints on both web
 * (app/actions/profiles.ts) and mobile (app/api/mobile-profiles/**) accepted
 * `avatar` completely unvalidated — any JSON value (not just a short emoji
 * string) was passed straight through to Prisma. A non-string value would
 * throw an unhandled Prisma type error (-> undifferentiated 500), and an
 * unbounded string could bloat storage or break the fixed-size UI slot both
 * clients render it into (a raw `Text(profile.avatar!, fontSize: 36)` on
 * mobile with no maxLines/overflow handling).
 *
 * Returns an error message if invalid, or null if `avatar` is valid
 * (including `undefined`/`null`, both of which mean "no avatar").
 */
export function validateAvatar(avatar: unknown): string | null {
  if (avatar === undefined || avatar === null) return null;
  if (typeof avatar !== "string") return "Invalid avatar.";
  if (avatar.length > MAX_AVATAR_LENGTH) return `Avatar must be ${MAX_AVATAR_LENGTH} characters or fewer.`;
  return null;
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

/**
 * After a family plan purchase, fill learner profile slots up to
 * FAMILY_PROFILE_LIMIT. Existing profiles are preserved. Idempotent.
 *
 * This is the SINGLE consolidated implementation — it used to be
 * copy-pasted independently in the Stripe webhook, verify-payment route,
 * create-family-subscription-intent route, and the web profiles action,
 * each with its own hardcoded `5` and none of them race-safe. Two of those
 * call sites (webhook + verify-payment racing each other after the same
 * purchase, or a mobile app + web tab both triggering this around the same
 * purchase) reading `existingProfiles.length` outside a transaction could
 * both see 0 existing profiles and both insert a full set of 5, landing 10
 * profiles on one family account. Serializable isolation + retry closes
 * that window the same way profile creation/deletion already do.
 */
export async function ensureFamilyProfilesForUser(userId: string): Promise<number> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const [existingProfiles, user] = await Promise.all([
            tx.learnerProfile.findMany({
              where: { userId },
              select: { id: true, isDefault: true },
              orderBy: { createdAt: "asc" },
            }),
            tx.user.findUnique({ where: { id: userId }, select: { fullName: true } }),
          ]);

          const toCreate = FAMILY_PROFILE_LIMIT - existingProfiles.length;
          if (toCreate <= 0) return 0;

          const hasDefault = existingProfiles.some((p) => p.isDefault);
          const existingCount = existingProfiles.length;
          const newProfiles = Array.from({ length: toCreate }, (_, i) => {
            const slot = existingCount + i + 1;
            const isMainSlot = slot === 1;
            return {
              id: crypto.randomUUID(),
              userId,
              displayName: isMainSlot ? (user?.fullName?.trim() || "Main Learner") : `Learner ${slot}`,
              isDefault: isMainSlot && !hasDefault,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          });

          await tx.learnerProfile.createMany({ data: newProfiles });
          return newProfiles.length;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (e) {
      const isSerializationFailure =
        e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034";
      if (!isSerializationFailure || attempt === maxAttempts) throw e;
      await new Promise((r) => setTimeout(r, 50 * attempt));
    }
  }
  // Unreachable — the loop above always returns or throws.
  return 0;
}

/**
 * After marking a lifetime purchase refunded/revoked, clear `user.hasPaid`
 * ONLY if no OTHER legitimate lifetime evidence exists (a separate Stripe
 * purchase, or another still-active mobile lifetime purchase) — never
 * blindly strip access a paying customer earned through a completely
 * different purchase just because one specific lifetime purchase was
 * refunded.
 *
 * This is the SINGLE consolidated implementation (Audit L-dedupe-clearhaspaid)
 * — it used to be copy-pasted near-identically in both
 * app/api/webhooks/apple-notifications/route.ts and
 * app/api/webhooks/google-play-notifications/route.ts, with no shared source
 * of truth for what "other lifetime evidence" means.
 */
export async function clearHasPaidIfNoOtherLifetimeEvidence(
  userId: string,
  excludeMobilePurchaseId: string,
  logPrefix: string,
): Promise<void> {
  const [otherMobileLifetime, stripePurchase] = await Promise.all([
    prisma.mobilePurchase.findFirst({
      where: { userId, status: "active", purchaseType: "lifetime", id: { not: excludeMobilePurchaseId } },
      select: { id: true },
    }),
    prisma.purchase.findFirst({ where: { userId, status: "succeeded" }, select: { id: true } }),
  ]);
  if (!otherMobileLifetime && !stripePurchase) {
    console.log(`[${logPrefix}] Clearing hasPaid for user ${userId} (no other lifetime evidence)`);
    await prisma.user.update({ where: { id: userId }, data: { hasPaid: false } });
  }
}

/**
 * After a Stripe lifetime Purchase is refunded/disputed, clear hasPaid unless
 * another succeeded Stripe purchase or active mobile lifetime remains.
 * Also downgrade planType when the refunded purchase was the only family grant.
 * Mirrors clearHasPaidIfNoOtherLifetimeEvidence used by Apple/Google webhooks.
 */
export async function clearHasPaidIfNoOtherStripeLifetimeEvidence(
  userId: string,
  excludePurchaseId: string,
  logPrefix: string,
  options?: { refundedPlanId?: string | null },
): Promise<void> {
  const [otherStripe, mobileLifetime, otherFamilyStripe, familyMobile] = await Promise.all([
    prisma.purchase.findFirst({
      where: { userId, status: "succeeded", id: { not: excludePurchaseId } },
      select: { id: true, planId: true },
    }),
    prisma.mobilePurchase.findFirst({
      where: { userId, status: "active", purchaseType: "lifetime" },
      select: { id: true },
    }),
    prisma.purchase.findFirst({
      where: {
        userId,
        status: "succeeded",
        planId: "family",
        id: { not: excludePurchaseId },
      },
      select: { id: true },
    }),
    // Family mobile products use productId/plan metadata — treat any active
    // mobile lifetime as sufficient to keep family only when we can't tell;
    // downgrade when refunded plan was family and no other family Stripe row.
    prisma.mobilePurchase.findFirst({
      where: { userId, status: "active", purchaseType: "lifetime" },
      select: { id: true, productId: true },
    }),
  ]);

  const updates: { hasPaid?: boolean; planType?: string } = {};

  if (!otherStripe && !mobileLifetime) {
    updates.hasPaid = false;
  }

  // Family upgrade refund: restore individual when no other family grant remains
  // (other family Purchase, family mobile product, OR open family Stripe monthly).
  if (options?.refundedPlanId === "family" && !otherFamilyStripe) {
    const familyMonthlyPriceId =
      process.env.STRIPE_PRICE_FAMILY_MONTHLY ?? process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID ?? "";
    const openFamilySub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["active", "trialing", "past_due", "unpaid"] },
        ...(familyMonthlyPriceId ? { stripePriceId: familyMonthlyPriceId } : { id: "__none__" }),
      },
      select: { id: true },
    });
    const mobileLooksFamily =
      !!familyMobile?.productId && /family/i.test(familyMobile.productId);
    if (!mobileLooksFamily && !openFamilySub) {
      updates.planType = "individual";
    }
  }

  if (Object.keys(updates).length > 0) {
    console.log(
      `[${logPrefix}] Updating user ${userId} after Stripe lifetime revoke: ${JSON.stringify(updates)}`,
    );
    await prisma.user.update({ where: { id: userId }, data: updates });
  }
}
