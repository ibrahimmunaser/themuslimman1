/**
 * AUTOMATED TESTS: POST /api/stripe/checkout/apply-saved-card
 *
 * This route is the server-side gate the checkout saved-card path calls right
 * before confirming a payment — it is the ONE place a client-supplied
 * paymentMethodId is actually re-verified against the authenticated user's own
 * Stripe customer before being trusted for anything.
 *
 * Scenarios:
 *  - Unauthenticated request rejected
 *  - Missing / malformed body rejected
 *  - [Test] Payment-method endpoint failure (Stripe retrieve throws) → safe rejection
 *  - [Test] PaymentMethod belonging to another Stripe customer → rejected, no
 *    subscription update attempted
 *  - Expired payment method → rejected
 *  - [Test] One-time lifetime purchase (no subscriptionId) → ownership verified,
 *    but customers.update / subscriptions.update are NEVER called (must not
 *    silently change the customer's global default for a one-time purchase)
 *  - [Test] Monthly subscription renewal method — owned card + owned subscription
 *    → subscriptions.update called with default_payment_method pinned to that
 *    subscription (and customer-level default is untouched)
 *  - Subscription belonging to another customer → rejected, subscriptions.update
 *    never called
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/stripe", () => ({
  stripe: {
    paymentMethods: { retrieve: vi.fn() },
    subscriptions: { retrieve: vi.fn(), update: vi.fn() },
    customers: { update: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { POST } from "@/app/api/stripe/checkout/apply-saved-card/route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fakeRequest(body: any) {
  return { json: async () => body } as unknown as Parameters<typeof POST>[0];
}

const USER = { id: "user_1", email: "u@example.com" };
const CUSTOMER_ID = "cus_owner";

beforeEach(() => {
  vi.clearAllMocks();
  (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(USER);
  (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ stripeCustomerId: CUSTOMER_ID });
});

describe("apply-saved-card — auth & input validation", () => {
  it("rejects unauthenticated requests", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST(fakeRequest({ paymentMethodId: "pm_1" }));
    expect(res.status).toBe(401);
  });

  it("rejects malformed JSON body", async () => {
    const req = { json: async () => { throw new Error("bad json"); } } as unknown as Parameters<typeof POST>[0];
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects a request with no paymentMethodId", async () => {
    const res = await POST(fakeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the user has no Stripe customer yet", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ stripeCustomerId: null });
    const res = await POST(fakeRequest({ paymentMethodId: "pm_1" }));
    expect(res.status).toBe(404);
  });
});

describe("apply-saved-card — ownership verification (never trust the client)", () => {
  it("[Test] payment-method endpoint failure — Stripe retrieve throws — safely rejected, not treated as owned", async () => {
    (stripe.paymentMethods.retrieve as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Stripe API down"));
    const res = await POST(fakeRequest({ paymentMethodId: "pm_1" }));
    expect(res.status).toBe(403);
    expect(stripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it("[Test] PaymentMethod belonging to another Stripe customer is rejected", async () => {
    (stripe.paymentMethods.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "pm_1",
      customer: "cus_ATTACKER",
      card: { exp_month: 12, exp_year: 2030 },
    });
    const res = await POST(fakeRequest({ paymentMethodId: "pm_1", subscriptionId: "sub_1" }));
    expect(res.status).toBe(403);
    expect(stripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it("rejects an expired payment method even if owned by the right customer", async () => {
    (stripe.paymentMethods.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "pm_1",
      customer: CUSTOMER_ID,
      card: { exp_month: 1, exp_year: 2020 },
    });
    const res = await POST(fakeRequest({ paymentMethodId: "pm_1" }));
    expect(res.status).toBe(403);
  });

  it("handles Stripe's expanded customer object shape ({ id: ... }), not just a raw string", async () => {
    (stripe.paymentMethods.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "pm_1",
      customer: { id: CUSTOMER_ID },
      card: { exp_month: 12, exp_year: 2030 },
    });
    const res = await POST(fakeRequest({ paymentMethodId: "pm_1" }));
    expect(res.status).toBe(200);
  });
});

describe("apply-saved-card — one-time / lifetime purchase (no subscriptionId)", () => {
  it("[Test] verifies ownership but never touches customer-level or subscription default", async () => {
    (stripe.paymentMethods.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "pm_1",
      customer: CUSTOMER_ID,
      card: { exp_month: 12, exp_year: 2030 },
    });
    const res = await POST(fakeRequest({ paymentMethodId: "pm_1" })); // no subscriptionId
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    // Must NOT silently change the customer's global default for a one-time purchase.
    expect(stripe.customers.update).not.toHaveBeenCalled();
    expect(stripe.subscriptions.update).not.toHaveBeenCalled();
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });
});

describe("apply-saved-card — monthly subscription renewal method", () => {
  beforeEach(() => {
    (stripe.paymentMethods.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "pm_1",
      customer: CUSTOMER_ID,
      card: { exp_month: 12, exp_year: 2030 },
    });
  });

  it("[Test] pins the saved card as the NEW subscription's default_payment_method", async () => {
    (stripe.subscriptions.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_1",
      customer: CUSTOMER_ID,
    });
    const res = await POST(fakeRequest({ paymentMethodId: "pm_1", subscriptionId: "sub_1" }));
    expect(res.status).toBe(200);
    expect(stripe.subscriptions.update).toHaveBeenCalledWith("sub_1", { default_payment_method: "pm_1" });
    // Guarantees future renewals use this card at the subscription level — the
    // customer-wide default (relevant if the customer has multiple subs/courses
    // later) is deliberately left untouched.
    expect(stripe.customers.update).not.toHaveBeenCalled();
  });

  it("rejects when the subscription belongs to a different customer", async () => {
    (stripe.subscriptions.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_1",
      customer: "cus_OTHER",
    });
    const res = await POST(fakeRequest({ paymentMethodId: "pm_1", subscriptionId: "sub_1" }));
    expect(res.status).toBe(403);
    expect(stripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it("rejects when the subscription cannot be found (retrieve throws)", async () => {
    (stripe.subscriptions.retrieve as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("No such subscription"));
    const res = await POST(fakeRequest({ paymentMethodId: "pm_1", subscriptionId: "sub_gone" }));
    expect(res.status).toBe(403);
    expect(stripe.subscriptions.update).not.toHaveBeenCalled();
  });
});
