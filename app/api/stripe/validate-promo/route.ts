import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";
import { PLANS } from "@/lib/stripe";

/**
 * GET /api/stripe/validate-promo?code=XXX
 *
 * Validates a promo code server-side without exposing the full code list.
 * Returns discount details for the "complete" plan.
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

  const plan = PLANS["complete"];
  const finalPrice = applyDiscount(plan.price, promo);
  const discountAmount = plan.price - finalPrice;

  return NextResponse.json({
    valid: true,
    code: code.trim().toUpperCase(),
    label: promo.label,
    discountAmount,
    finalPrice,
    originalPrice: plan.price,
  });
}
