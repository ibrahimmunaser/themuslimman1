import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";
import { getBasePrice, isEarlyAccessActive, REGULAR_PRICE } from "@/lib/early-access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

/**
 * GET /api/stripe/validate-promo?code=XXX
 *
 * Validates a promo code server-side.
 * Returns discount details based on the CURRENT base price
 * (which depends on whether the early-access deadline has passed).
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

  if (!code || code.trim().length === 0) {
    return NextResponse.json({ valid: false, error: "Please enter a code" }, { status: 400 });
  }

  const promo = validatePromoCode(code);

  if (!promo) {
    return NextResponse.json({ valid: false, error: "Invalid promo code" }, { status: 400 });
  }

  const earlyAccessActive = isEarlyAccessActive();
  const basePrice = getBasePrice();       // always 4900
  const finalPrice = applyDiscount(basePrice, promo);
  const promoDiscountAmount = basePrice - finalPrice;
  const earlyAccessDiscount = 0; // no early-access period

  return NextResponse.json({
    valid: true,
    code: code.trim().toUpperCase(),
    label: promo.label,
    // Base price is always 9900 ($99)
    basePrice,
    // How much the promo saves vs. the current base
    promoDiscountAmount,
    finalPrice,
    // Early-access context (always false — kept for API shape compatibility)
    earlyAccessActive,
    earlyAccessDiscount,
    regularPrice: REGULAR_PRICE, // always 4900
  });
}
