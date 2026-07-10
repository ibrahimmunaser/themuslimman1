/**
 * Pure decision logic + server-side allowlist for the free-trial provisioning
 * flow (BLK-02 fix). No side effects, no database access, no Stripe calls —
 * this module is the single source of truth for:
 *
 *  1. What a TrialEligibility claim attempt should DO, given whatever row (if
 *     any) already exists for a (userId, courseKey) pair.
 *  2. Which Stripe price ID a trial planId is allowed to resolve to.
 *
 * See app/api/stripe/webhook/route.ts (claimTrialEligibility,
 * handleTrialSetupIntentSucceeded) for the Prisma/Stripe orchestration that
 * calls into this module.
 */

/** Single course today; kept as an explicit key so a future second course
 *  gets its own independent one-trial-per-user claim without a schema change. */
export const TRIAL_COURSE_KEY = "seerah";

export type TrialClaimAction =
  /** No existing row raced in — caller should attempt prisma.trialEligibility.create(). */
  | "proceed"
  /** A row already exists for this EXACT setupIntentId, but stripeSubId is still
   *  null — a prior attempt claimed the slot but never finished (e.g. the DB
   *  transaction failed after Stripe already created the subscription, or this
   *  is the same event being retried). Safe to continue: re-call
   *  stripe.subscriptions.create with the SAME idempotency key (returns the
   *  same object if it already exists) and finish the transaction. */
  | "recovered_no_sub_yet"
  /** A row already exists for this EXACT setupIntentId AND already has a
   *  stripeSubId — this claim is fully finished. Redelivered/duplicate event;
   *  no new Stripe call should be made. */
  | "already_completed"
  /** A row exists for a DIFFERENT setupIntentId. The trial for this user+course
   *  was already claimed by another SetupIntent (the losing side of a two-tab
   *  race, or a genuinely separate later attempt). Must NOT create a Stripe
   *  subscription for the current setupIntentId — return success/no-op. */
  | "claimed_by_other";

export interface TrialEligibilityRow {
  id: string;
  setupIntentId: string;
  stripeSubId: string | null;
}

export interface TrialClaimDecision {
  action: TrialClaimAction;
  /** The TrialEligibility row id relevant to this decision (existing or newly created by the caller). */
  id: string;
  stripeSubId: string | null;
}

/**
 * Given an existing TrialEligibility row (or null, meaning none exists yet)
 * and the setupIntentId currently being processed, decides what the caller
 * should do next. Returns null when `existing` is null — the caller must
 * attempt to CREATE the row itself (a pure function cannot performed that
 * side effect), then call this again with whatever it found/created.
 */
export function decideTrialClaimAction(
  existing: TrialEligibilityRow | null,
  setupIntentId: string,
): TrialClaimDecision | null {
  if (!existing) return null;

  if (existing.setupIntentId !== setupIntentId) {
    return { action: "claimed_by_other", id: existing.id, stripeSubId: existing.stripeSubId };
  }
  if (!existing.stripeSubId) {
    return { action: "recovered_no_sub_yet", id: existing.id, stripeSubId: null };
  }
  return { action: "already_completed", id: existing.id, stripeSubId: existing.stripeSubId };
}

/**
 * Server-side allowlist mapping a trial planId to a trusted Stripe price ID.
 * Never trust a raw price ID supplied via Stripe object metadata — metadata
 * is set by our own code today, but re-resolving through this allowlist on
 * the webhook side means a webhook handler never blindly trusts a string
 * that merely LOOKS like it came from our own prior write.
 *
 * Returns null for an unrecognized planId or a misconfigured/missing env var
 * (anything not shaped like a real Stripe price ID).
 */
export function resolveTrialPriceId(planId: string | null | undefined): string | null {
  const INDIVIDUAL_MONTHLY_PRICE_ID =
    process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY ?? process.env.STRIPE_MONTHLY_PRICE_ID ?? "";
  const FAMILY_MONTHLY_PRICE_ID =
    process.env.STRIPE_PRICE_FAMILY_MONTHLY ?? process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID ?? "";

  const allowlist: Record<string, string> = {
    individualTrial: INDIVIDUAL_MONTHLY_PRICE_ID,
    familyTrial: FAMILY_MONTHLY_PRICE_ID,
  };

  const priceId = planId ? allowlist[planId] : undefined;
  return priceId && priceId.startsWith("price_") ? priceId : null;
}
