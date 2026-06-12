import { NextRequest, NextResponse } from "next/server";
import { completeAccountSetup } from "@/lib/auth";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

/**
 * POST /api/auth/set-password
 *
 * Completes the post-checkout account setup for guest users:
 *  - Validates the setup token (same mechanism as password reset).
 *  - Sets the user's password and marks their email as verified.
 *  - Creates a fresh session so the browser is immediately authenticated.
 *
 * The setup link (/set-password?token=xxx) is emailed after a successful
 * purchase. Tokens expire in 48 hours.
 */
export async function POST(request: NextRequest) {
  const ip = getIP(request);
  const rl = checkRateLimit(`set-password:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    const result = await completeAccountSetup(token, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to set password" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SET_PASSWORD] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
