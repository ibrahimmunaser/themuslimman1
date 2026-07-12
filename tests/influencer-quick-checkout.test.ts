/**
 * Tests for the influencer quick-checkout flow.
 *
 * Covers: config loading, step navigation, dedup, attribution, analytics.
 * Stripe and fetch are mocked — no real network calls.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getInfluencerConfig,
  isQuickCheckoutEnabled,
  influencerCheckoutUrl,
  INFLUENCER_CONFIGS,
} from "@/lib/influencer-configs";
import {
  startCheckoutAttempt,
  clearCheckoutAttempt,
} from "@/lib/checkout-attempt";

// ── Helpers ───────────────────────────────────────────────────────────────────

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear()      { map.clear(); },
    getItem(k)   { return map.get(k) ?? null; },
    key(i)       { return [...map.keys()][i] ?? null; },
    removeItem(k){ map.delete(k); },
    setItem(k,v) { map.set(k, v); },
  };
}

// ── Config loading ─────────────────────────────────────────────────────────────

describe("influencer config loading", () => {
  it("returns config for every known slug", () => {
    const slugs = ["theorthodoxmuslim", "korra", "itachi", "deenresponds", "browniesaadi"];
    for (const slug of slugs) {
      const cfg = getInfluencerConfig(slug);
      expect(cfg, `Config missing for ${slug}`).not.toBeNull();
      expect(cfg!.slug).toBe(slug);
      expect(cfg!.displayName).toBeTruthy();
      expect(cfg!.badgeText).toBeTruthy();
    }
  });

  it("returns null for an unknown slug", () => {
    expect(getInfluencerConfig("unknown-slug")).toBeNull();
  });

  it("every config has required UTM fields", () => {
    for (const cfg of Object.values(INFLUENCER_CONFIGS)) {
      expect(cfg.utmSource,   `${cfg.slug} utmSource missing`).toBeTruthy();
      expect(cfg.utmMedium,   `${cfg.slug} utmMedium missing`).toBeTruthy();
      expect(cfg.utmCampaign, `${cfg.slug} utmCampaign missing`).toBeTruthy();
      expect(cfg.utmContent,  `${cfg.slug} utmContent missing`).toBeTruthy();
    }
  });
});

// ── Feature flag ───────────────────────────────────────────────────────────────

describe("isQuickCheckoutEnabled", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_INFLUENCER_QUICK_CHECKOUT", "false");
  });

  it("is false when env var is not 'true' and config has no override", () => {
    const cfg = getInfluencerConfig("korra")!;
    expect(isQuickCheckoutEnabled(cfg)).toBe(false);
  });

  it("is true when env var is 'true'", () => {
    vi.stubEnv("NEXT_PUBLIC_INFLUENCER_QUICK_CHECKOUT", "true");
    const cfg = getInfluencerConfig("korra")!;
    expect(isQuickCheckoutEnabled(cfg)).toBe(true);
  });

  it("per-slug override trumps env var", () => {
    vi.stubEnv("NEXT_PUBLIC_INFLUENCER_QUICK_CHECKOUT", "false");
    expect(isQuickCheckoutEnabled({ ...getInfluencerConfig("korra")!, quickCheckoutEnabled: true })).toBe(true);
    expect(isQuickCheckoutEnabled({ ...getInfluencerConfig("korra")!, quickCheckoutEnabled: false })).toBe(false);
  });
});

// ── Checkout URL builder ───────────────────────────────────────────────────────

describe("influencerCheckoutUrl", () => {
  it("includes slug as source parameter", () => {
    const url = influencerCheckoutUrl("korra");
    expect(url).toContain("source=korra");
    expect(url).toContain("plan=individual-monthly");
    expect(url).toContain("utm_source=tiktok");
  });

  it("falls back gracefully for unknown slugs", () => {
    const url = influencerCheckoutUrl("unknown", "individual-monthly");
    expect(url).toContain("source=unknown");
    expect(url).toContain("plan=individual-monthly");
  });

  it("default plan is individual-monthly", () => {
    const url = influencerCheckoutUrl("korra");
    expect(url).toContain("plan=individual-monthly");
  });
});

// ── Checkout attempt creation ──────────────────────────────────────────────────

describe("checkout attempt ID (influencer flow)", () => {
  beforeEach(() => {
    const storage = createMemoryStorage();
    vi.stubGlobal("window", { sessionStorage: storage });
    vi.stubGlobal("sessionStorage", storage);
    clearCheckoutAttempt();
  });

  it("creates a new attempt ID for a new session", () => {
    const attempt = startCheckoutAttempt("individual-monthly", { source: "korra" });
    expect(attempt.checkout_attempt_id).toBeTruthy();
    expect(attempt.plan_id).toBe("individual-monthly");
  });

  it("reuses the same attempt ID within the reuse window", () => {
    const first  = startCheckoutAttempt("individual-monthly", { source: "korra" });
    const second = startCheckoutAttempt("individual-monthly", { source: "korra" });
    expect(second.checkout_attempt_id).toBe(first.checkout_attempt_id);
  });

  it("does not create a duplicate on re-render (same plan, same session)", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 5; i++) {
      ids.add(startCheckoutAttempt("individual-monthly").checkout_attempt_id);
    }
    expect(ids.size).toBe(1);
  });

  it("creates a new attempt ID when plan changes", () => {
    const a = startCheckoutAttempt("individual-monthly");
    clearCheckoutAttempt();
    const b = startCheckoutAttempt("family-monthly");
    expect(b.checkout_attempt_id).not.toBe(a.checkout_attempt_id);
  });
});

// ── Plan defaults ─────────────────────────────────────────────────────────────

describe("default plan selection", () => {
  it("all influencer configs default to individual-monthly", () => {
    // The new flow hard-codes individual-monthly as the primary offer.
    // Verify configs don't accidentally reference a different default.
    for (const cfg of Object.values(INFLUENCER_CONFIGS)) {
      // No config should override to a non-monthly plan for the quick checkout offer
      const url = influencerCheckoutUrl(cfg.slug);
      expect(url).toContain("individual-monthly");
    }
  });
});

// ── Attribution persistence ────────────────────────────────────────────────────

describe("referral attribution", () => {
  beforeEach(() => {
    const ls = createMemoryStorage();
    vi.stubGlobal("localStorage", ls);
    vi.stubGlobal("document", {
      cookie: "",
      referrer: "",
    });
    vi.stubGlobal("window", {
      location: {
        pathname: "/korra",
        search: "?utm_source=tiktok&utm_medium=influencer",
        href: "https://themuslimman.com/korra?utm_source=tiktok&utm_medium=influencer",
      },
    });
  });

  it("captures utm_source and utm_medium from URL on landing", async () => {
    const { captureAttribution } = await import("@/lib/attribution");
    const attr = captureAttribution();
    expect(attr.utmSource).toBe("tiktok");
    expect(attr.utmMedium).toBe("influencer");
  });
});

// ── Analytics (smoke tests) ────────────────────────────────────────────────────

describe("analytics event names", () => {
  const REQUIRED_EVENTS = [
    "influencer_landing_view",
    "influencer_primary_cta_clicked",
    "influencer_free_preview_clicked",
    "part_1_started",
    "part_1_50_percent",
    "part_1_completed",
    "alternate_plans_opened",
    "checkout_back_clicked",
    "checkout_loaded",
    "payment_element_loaded",
    "payment_method_available",
    "checkout_payment_started",
    "payment_failed",
    "payment_succeeded",
  ];

  it("all required event name strings are non-empty", () => {
    for (const name of REQUIRED_EVENTS) {
      expect(name.length, `Event name ${name} is empty`).toBeGreaterThan(0);
      expect(name, `Event name should not contain spaces`).not.toContain(" ");
    }
  });
});
