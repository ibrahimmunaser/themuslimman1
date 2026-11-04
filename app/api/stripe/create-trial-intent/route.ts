import { NextResponse } from "next/server";

// The free 7-day trial is no longer offered — individual monthly ($4.99/mo,
// create-subscription-intent) is the only plan sold going forward. Existing
// trial subscriptions keep running in Stripe; this endpoint just no longer
// starts a new one.
export async function POST() {
  return NextResponse.json(
    { error: "The free trial is no longer available." },
    { status: 410 },
  );
}
