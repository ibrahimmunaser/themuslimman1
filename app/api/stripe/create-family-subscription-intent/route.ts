import { NextResponse } from "next/server";

// Existing family subscriptions keep running in Stripe. This endpoint no longer starts or upgrades one.
export async function POST() {
  return NextResponse.json(
    { error: "Family plans are no longer available." },
    { status: 410 },
  );
}
