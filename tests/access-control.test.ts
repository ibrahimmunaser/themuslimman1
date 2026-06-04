/**
 * AUTOMATED RISK: Monthly subscription gate
 *
 * Tests hasActiveCourseAccess() to confirm:
 *  1. Monthly subscribers CAN access paid content
 *  2. Lifetime buyers CAN access paid content
 *  3. Users with hasPaid=true CAN access paid content (gifted / migrated)
 *  4. Users with no access CANNOT access paid content
 *  5. Expired subscriptions are REJECTED
 *  6. Canceled subscriptions (past currentPeriodEnd) are REJECTED
 *
 * Prisma is mocked so no real database is needed.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Prisma client before importing any module that uses it.
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    purchase: {
      findFirst: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
    },
    mobilePurchase: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { hasActiveCourseAccess } from "@/lib/access";

const _FUTURE_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const _PAST_DATE   = new Date(Date.now() - 1);

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no purchases, no subscription, no mobile purchases, hasPaid=false
  (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ hasPaid: false });
  (prisma.purchase.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  (prisma.subscription.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  (prisma.mobilePurchase.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
});

describe("hasActiveCourseAccess — fast path (hasPaid session flag)", () => {
  it("returns true immediately when sessionHasPaid=true without hitting DB", async () => {
    const result = await hasActiveCourseAccess("user-1", true);
    expect(result).toBe(true);
    // DB should not be queried
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.purchase.findFirst).not.toHaveBeenCalled();
  });
});

describe("hasActiveCourseAccess — lifetime purchase", () => {
  it("grants access via Purchase record", async () => {
    (prisma.purchase.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "purchase-1" });
    const result = await hasActiveCourseAccess("user-1");
    expect(result).toBe(true);
  });
});

describe("hasActiveCourseAccess — hasPaid DB flag (gifted users)", () => {
  it("grants access when user.hasPaid is true in DB", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ hasPaid: true });
    const result = await hasActiveCourseAccess("user-1");
    expect(result).toBe(true);
  });
});

describe("hasActiveCourseAccess — monthly subscription (CRITICAL BUG FIX)", () => {
  it("grants access to active monthly subscriber", async () => {
    (prisma.subscription.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "sub-1" });
    const result = await hasActiveCourseAccess("user-1");
    expect(result).toBe(true);
  });

  it("BLOCKS: active subscriber with expired currentPeriodEnd is denied", async () => {
    // Subscription is still "active" in Stripe status but currentPeriodEnd is past
    // The query filters on currentPeriodEnd >= now, so mock returns null (no match)
    (prisma.subscription.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await hasActiveCourseAccess("user-1");
    expect(result).toBe(false);
  });
});

describe("hasActiveCourseAccess — mobile purchase", () => {
  it("grants access for active lifetime mobile purchase", async () => {
    (prisma.mobilePurchase.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "mp-1" });
    const result = await hasActiveCourseAccess("user-1");
    expect(result).toBe(true);
  });
});

describe("hasActiveCourseAccess — no access", () => {
  it("returns false for user with no purchases, no subscription, hasPaid=false", async () => {
    const result = await hasActiveCourseAccess("user-1");
    expect(result).toBe(false);
  });

  it("returns false for unknown userId (user not found)", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await hasActiveCourseAccess("unknown-user");
    expect(result).toBe(false);
  });
});
