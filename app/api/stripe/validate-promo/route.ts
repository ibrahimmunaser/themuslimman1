import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";
import { getBasePrice, isEarlyAccessActive, REGULAR_PRICE } from "@/lib/early-access";
import { PLANS } from "@/lib/stripe-config";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

/**
 * GET /api/stripe/validate-promo?code=XXX[&plan=family]
 *
 * Validates a promo code server-side.
 * Returns discount details based on the CURRENT base price for the requested plan.
 *   plan=family     → uses family lifetime price ($199)
 *   plan=individual → uses individual lifetime price (default, early-access aware)
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

  const earlyAccessActive = isEarlyAccessActive();
  // Use family plan base price if requested, otherwise individual (early-access aware).
  const basePrice = plan === "family" ? PLANS.family.price : getBasePrice();
  const finalPrice = applyDiscount(basePrice, promo);
  const promoDiscountAmount = basePrice - finalPrice;
  const earlyAccessDiscount = 0; // no early-access period active

  return NextResponse.json({
    valid: true,
    code: code.trim().toUpperCase(),
    label: promo.label,
    basePrice,
    promoDiscountAmount,
    finalPrice,
    // Early-access context kept for API shape compatibility (currently always false)
    earlyAccessActive,
    earlyAccessDiscount,
    regularPrice: REGULAR_PRICE,
  });
}
