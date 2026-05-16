import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";
import { getBasePrice, isEarlyAccessActive, REGULAR_PRICE } from "@/lib/early-access";

/**
 * GET /api/stripe/validate-promo?code=XXX
 *
 * Validates a promo code server-side.
 * Returns discount details based on the CURRENT base price
 * (which depends on whether the early-access deadline has passed).
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code || code.trim().length === 0) {
    return NextResponse.json({ valid: false, error: "Please enter a code" }, { status: 400 });
  }

  const promo = validatePromoCode(code);

  if (!promo) {
    return NextResponse.json({ valid: false, error: "Invalid promo code" }, { status: 400 });
  }

  const earlyAccessActive = isEarlyAccessActive();
  const basePrice = getBasePrice();       // 9900 or 14900 depending on deadline
  const finalPrice = applyDiscount(basePrice, promo);
  const promoDiscountAmount = basePrice - finalPrice;
  const earlyAccessDiscount = earlyAccessActive ? REGULAR_PRICE - basePrice : 0;

  return NextResponse.json({
    valid: true,
    code: code.trim().toUpperCase(),
    label: promo.label,
    // Base price server computed (9900 or 14900)
    basePrice,
    // How much the promo saves vs. the current base
    promoDiscountAmount,
    finalPrice,
    // Early-access context so the UI can display the full discount stack
    earlyAccessActive,
    earlyAccessDiscount,
    regularPrice: REGULAR_PRICE, // always 14900
  });
}
