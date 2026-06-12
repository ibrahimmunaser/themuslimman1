import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";
import { PLANS } from "@/lib/stripe-config";

/** Individual lifetime price in cents ($79). */
const INDIVIDUAL_BASE_PRICE = PLANS.complete.price;
import { checkRateLimit, getIP } from "@/lib/rate-limit";

/**
 * GET /api/stripe/validate-promo?code=XXX[&plan=family]
 *
 * Validates a promo code server-side.
 * Returns discount details based on the CURRENT base price for the requested plan.
 *   plan=family     → uses family lifetime price ($149)
 *   plan=individual → uses individual lifetime price ($79)
 */
export async function GET(request: NextRequest) {
  // Rate limit: 10 attempts per 5 minutes per IP to prevent brute-force enumeration.
  const ip = getIP(request);
  const rl = checkRateLimit(`validate-promo:${ip}`, 10, 5 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { valid: false, error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const plan = request.nextUrl.searchParams.get("plan"); // "family" | "individual" (default)

  if (!code || code.trim().length === 0) {
    return NextResponse.json({ valid: false, error: "Please enter a code" }, { status: 400 });
  }

  const promo = validatePromoCode(code);

  if (!promo) {
    return NextResponse.json({ valid: false, error: "Invalid promo code" }, { status: 400 });
  }

  // Enforce plan restrictions — absolute codes scoped to one plan type cannot be
  // applied to the other.
  if (promo.planType === "family" && plan !== "family") {
    return NextResponse.json(
      { valid: false, error: "This code is for family plans only" },
      { status: 400 }
    );
  }
  if (promo.planType === "individual" && plan === "family") {
    return NextResponse.json(
      { valid: false, error: "This code is for individual plans only" },
      { status: 400 }
    );
  }

  const basePrice = plan === "family" ? PLANS.family.price : INDIVIDUAL_BASE_PRICE;
  const finalPrice = applyDiscount(basePrice, promo);
  const promoDiscountAmount = basePrice - finalPrice;

  return NextResponse.json({
    valid: true,
    code: code.trim().toUpperCase(),
    label: promo.label,
    basePrice,
    promoDiscountAmount,
    finalPrice,
  });
}
