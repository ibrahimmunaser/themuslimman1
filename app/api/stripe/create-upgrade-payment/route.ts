import { NextResponse } from "next/server";

// Upgrade flow disabled during early access — only Complete is sold.
// This route returns 410 Gone so any stale client code fails clearly.
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Upgrades are not available during early access. Complete Seerah is the only plan.",
    },
    { status: 410 }
  );
}
