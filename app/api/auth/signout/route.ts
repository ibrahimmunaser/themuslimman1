import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST() {
  await logout();
  return NextResponse.json({ success: true });
}

// GET handler for sign-out links (e.g. from the gift claim page).
// Clears the session cookie and redirects to `?redirect=` param or /login.
export async function GET(req: NextRequest) {
  await logout();
  const redirectTo = req.nextUrl.searchParams.get("redirect") ?? "/login";
  // Only allow same-origin redirects to prevent open-redirect attacks.
  const safe = redirectTo.startsWith("/") && !redirectTo.startsWith("//");
  return NextResponse.redirect(new URL(safe ? redirectTo : "/login", req.url));
}
