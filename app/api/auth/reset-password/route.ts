import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit: 5 attempts per 15 minutes per IP — prevent brute-forcing reset tokens.
  const ip = getIP(request);
  const rl = checkRateLimit(`reset-password:${ip}`, 5, 15 * 60 * 1000);
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

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password.length > 1000) {
      return NextResponse.json(
        { error: "Password is too long" },
        { status: 400 }
      );
    }

    const result = await resetPassword(token, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to reset password" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
