/**
 * Checkout analytics event dedup + checkout_attempt_id tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  buildInteractionKey,
  consumeInteractionSlot,
  resetInteractionDedupForTests,
  INTERACTION_DEDUP_MS,
} from "@/lib/interaction-dedup";
import {
  startCheckoutAttempt,
  beginNewCheckoutAttempt,
  clearCheckoutAttempt,
  getCheckoutAttemptId,
} from "@/lib/checkout-attempt";
import { planAnalyticsProps } from "@/lib/plan-catalog";
import {
  trackPlanSelectedFromClick,
  trackCheckoutClickedFromClick,
} from "@/lib/funnel-click-analytics";

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
  getSessionId: vi.fn(() => "test-session"),
  getVisitorId: vi.fn(() => "test-visitor"),
}));

vi.mock("@/lib/attribution", () => ({
  getAttribution: vi.fn(() => ({})),
  attributionToProps: vi.fn(() => ({ source: "test" })),
}));

import { trackEvent } from "@/lib/analytics";

function mockElement(planId: string, track: string): HTMLElement {
  return {
    tagName: "BUTTON",
    dataset: { track, plan: planId },
    id: "",
    className: "",
  } as unknown as HTMLElement;
}

function mockClick(timeStamp = 1000): MouseEvent {
  return {
    isTrusted: true,
    button: 0,
    type: "click",
    timeStamp,
  } as MouseEvent;
}

describe("interaction dedup", () => {
  beforeEach(() => {
    resetInteractionDedupForTests();
    vi.mocked(trackEvent).mockClear();
  });

  it("allows one plan_selected per physical click timestamp", () => {
    const event = mockClick(4242);
    const key = buildInteractionKey("plan_selected", "individual-monthly", event, "plan_selected:individual-monthly");
    expect(consumeInteractionSlot(key, INTERACTION_DEDUP_MS)).toBe(true);
    expect(consumeInteractionSlot(key, INTERACTION_DEDUP_MS)).toBe(false);
  });

  it("allows one checkout_clicked per physical click timestamp", () => {
    const event = mockClick(7777);
    const key = buildInteractionKey(
      "checkout_clicked",
      "individual-monthly",
      event,
      "checkout_clicked:individual-monthly"
    );
    expect(consumeInteractionSlot(key, INTERACTION_DEDUP_MS)).toBe(true);
    expect(consumeInteractionSlot(key, INTERACTION_DEDUP_MS)).toBe(false);
  });
});

describe("canonical click emitters", () => {
  beforeEach(() => {
    resetInteractionDedupForTests();
    vi.mocked(trackEvent).mockClear();
    const storage = createMemoryStorage();
    vi.stubGlobal("window", { sessionStorage: storage });
    vi.stubGlobal("sessionStorage", storage);
    clearCheckoutAttempt();
  });

  it("one plan card click emits exactly one plan_selected", () => {
    const event = mockClick(1111);
    const el = mockElement("individual-monthly", "plan_selected");
    const ctx = { creator: "homepage", handlerScope: "Test" };

    expect(trackPlanSelectedFromClick(event, el, ctx)).toBe(true);
    expect(trackPlanSelectedFromClick(event, el, ctx)).toBe(false);

    const planSelectedCalls = vi.mocked(trackEvent).mock.calls.filter(([name]) => name === "plan_selected");
    expect(planSelectedCalls).toHaveLength(1);
    expect(planSelectedCalls[0]?.[1]).toMatchObject({
      plan_id: "individual-monthly",
      plan_type: "individual",
      billing_interval: "monthly",
      price: 499,
      currency: "usd",
    });
  });

  it("one checkout click emits exactly one checkout_clicked", () => {
    const event = mockClick(2222);
    const el = mockElement("individual-monthly", "checkout_clicked");
    const ctx = { creator: "homepage", handlerScope: "Test" };

    expect(trackCheckoutClickedFromClick(event, el, ctx)).toBe(true);
    expect(trackCheckoutClickedFromClick(event, el, ctx)).toBe(false);

    const checkoutCalls = vi.mocked(trackEvent).mock.calls.filter(([name]) => name === "checkout_clicked");
    expect(checkoutCalls).toHaveLength(1);
    expect(checkoutCalls[0]?.[1]).toMatchObject({
      plan_id: "individual-monthly",
      checkout_attempt_id: expect.any(String),
      source: "test",
    });
  });
});

describe("checkout_attempt_id", () => {
  beforeEach(() => {
    const storage = createMemoryStorage();
    vi.stubGlobal("window", { sessionStorage: storage });
    vi.stubGlobal("sessionStorage", storage);
    clearCheckoutAttempt();
  });

  it("reuses attempt id for same plan within reuse window", () => {
    const first = startCheckoutAttempt("individual-monthly");
    const second = startCheckoutAttempt("individual-monthly");
    expect(second.checkout_attempt_id).toBe(first.checkout_attempt_id);
  });

  it("creates a new attempt id on explicit retry", () => {
    const first = startCheckoutAttempt("individual-monthly");
    const retry = beginNewCheckoutAttempt("individual-monthly");
    expect(retry.checkout_attempt_id).not.toBe(first.checkout_attempt_id);
    expect(getCheckoutAttemptId()).toBe(retry.checkout_attempt_id);
  });
});

describe("plan analytics props", () => {
  it("includes canonical plan fields", () => {
    const props = planAnalyticsProps("individual-monthly");
    expect(props).toMatchObject({
      plan_id: "individual-monthly",
      plan_type: "individual",
      billing_interval: "monthly",
      price: 499,
      currency: "usd",
    });
  });
});

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}
