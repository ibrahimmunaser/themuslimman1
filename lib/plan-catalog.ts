/**
 * Canonical plan metadata for analytics events.
 */

export type PlanId =
  | "individual-monthly"
  | "family-monthly"
  | "individual-lifetime"
  | "family-lifetime";

export type PlanAnalyticsFields = {
  plan_id: PlanId;
  plan_type: "individual" | "family";
  billing_interval: "monthly" | "lifetime";
  price: number;
  currency: "usd";
};

const PLAN_CATALOG: Record<PlanId, PlanAnalyticsFields> = {
  "individual-monthly": {
    plan_id: "individual-monthly",
    plan_type: "individual",
    billing_interval: "monthly",
    price: 499,
    currency: "usd",
  },
  "family-monthly": {
    plan_id: "family-monthly",
    plan_type: "family",
    billing_interval: "monthly",
    price: 999,
    currency: "usd",
  },
  "individual-lifetime": {
    plan_id: "individual-lifetime",
    plan_type: "individual",
    billing_interval: "lifetime",
    price: 4900,
    currency: "usd",
  },
  "family-lifetime": {
    plan_id: "family-lifetime",
    plan_type: "family",
    billing_interval: "lifetime",
    price: 7900,
    currency: "usd",
  },
};

const PLAN_ALIASES: Record<string, PlanId> = {
  individual: "individual-lifetime",
  family: "family-lifetime",
  monthly: "individual-monthly",
  complete: "individual-lifetime",
};

/** Resolve a raw data-plan / URL slug to a canonical plan id. */
export function resolvePlanId(raw: string | null | undefined): PlanId | null {
  if (!raw) return null;
  const slug = raw.trim().toLowerCase();
  if (slug in PLAN_CATALOG) return slug as PlanId;
  if (slug in PLAN_ALIASES) return PLAN_ALIASES[slug];
  const composite = slug.match(/^(individual|family)-(monthly|lifetime)$/);
  if (composite) return slug as PlanId;
  return null;
}

export function planAnalyticsFields(rawPlanId: string | null | undefined): PlanAnalyticsFields | null {
  const planId = resolvePlanId(rawPlanId);
  if (!planId) return null;
  return PLAN_CATALOG[planId];
}

export function planAnalyticsProps(rawPlanId: string | null | undefined): Record<string, unknown> {
  const fields = planAnalyticsFields(rawPlanId);
  if (!fields) return { plan_id: rawPlanId ?? "unknown" };
  return { ...fields };
}
