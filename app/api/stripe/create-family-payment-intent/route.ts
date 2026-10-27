import { NextResponse } from "next/server";

// Existing family members keep their access. This endpoint no longer sells or upgrades a family plan.
export async function POST() {
  return NextResponse.json(
    { error: "Family plans are no longer available." },
    { status: 410 },
  );
}
