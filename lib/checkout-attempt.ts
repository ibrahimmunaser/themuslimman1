/**
 * Checkout attempt identity — persisted in sessionStorage for checkout_v3 events.
 */

import { nanoid } from "nanoid";
import type { PlanId } from "@/lib/plan-catalog";
import { resolvePlanId } from "@/lib/plan-catalog";

export const CHECKOUT_ANALYTICS_SCHEMA = "checkout_v3";

const STORAGE_KEY = "tmm_checkout_attempt_v1";

/** Reuse attempt if same plan within this window unless forceNew. */
const REUSE_WINDOW_MS = 4 * 60 * 60 * 1000;

export type CheckoutAttemptState = {
  checkout_attempt_id: string;
  started_at: number;
  plan_id: PlanId | "unknown";
  source?: string;
};

function readRaw(): CheckoutAttemptState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckoutAttemptState;
  } catch {
    return null;
  }
}

function write(state: CheckoutAttemptState): CheckoutAttemptState {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
  return state;
}

/** Read active attempt id without creating one. */
export function getCheckoutAttemptId(): string | null {
  return readRaw()?.checkout_attempt_id ?? null;
}

export function getCheckoutAttemptState(): CheckoutAttemptState | null {
  return readRaw();
}

export function clearCheckoutAttempt(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Start or reuse a checkout attempt.
 * @param forceNew — always mint a new checkout_attempt_id (explicit retry).
 */
export function startCheckoutAttempt(
  rawPlanId: string | null | undefined,
  opts?: { forceNew?: boolean; source?: string }
): CheckoutAttemptState {
  const plan_id = resolvePlanId(rawPlanId) ?? "unknown";
  const now = Date.now();
  const existing = readRaw();

  if (
    !opts?.forceNew &&
    existing &&
    existing.plan_id === plan_id &&
    now - existing.started_at < REUSE_WINDOW_MS
  ) {
    return existing;
  }

  return write({
    checkout_attempt_id: nanoid(),
    started_at: now,
    plan_id,
    source: opts?.source,
  });
}

/** Payload merged into every checkout_v3 event. */
export function checkoutAttemptPayload(): Record<string, unknown> {
  const state = readRaw();
  return {
    analytics_schema_version: CHECKOUT_ANALYTICS_SCHEMA,
    checkout_attempt_id: state?.checkout_attempt_id ?? null,
    attempt_plan_id: state?.plan_id ?? null,
  };
}

/** Force a new checkout_attempt_id (explicit user retry). */
export function beginNewCheckoutAttempt(
  rawPlanId: string | null | undefined,
  source?: string
): CheckoutAttemptState {
  return startCheckoutAttempt(rawPlanId, { forceNew: true, source });
}
