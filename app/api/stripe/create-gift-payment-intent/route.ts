import { NextResponse } from "next/server";

// Gifting was only offered for the lifetime plan, which is no longer sold.
// A recurring monthly membership isn't meaningfully giftable, so this
// endpoint is disabled rather than adapted.
export async function POST() {
  return NextResponse.json(
    { error: "Gifting is no longer available." },
    { status: 410 },
  );
}
