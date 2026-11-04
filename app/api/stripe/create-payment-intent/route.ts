import { NextResponse } from "next/server";

// Existing lifetime holders keep their access. This endpoint only ever sold
// the one-time "complete" lifetime plan, which is no longer offered —
// individual monthly ($4.99/mo, create-subscription-intent) is the only plan
// sold going forward.
export async function POST() {
  return NextResponse.json(
    { error: "The lifetime plan is no longer available. Try the monthly membership instead." },
    { status: 410 },
  );
}
