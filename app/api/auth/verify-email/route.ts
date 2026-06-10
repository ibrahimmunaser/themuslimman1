import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmail, getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

const VerifySchema = z.object({
  token: z.string().min(1),
});

/**
 * POST /api/auth/verify-email
 * 
 * Verifies a user's email address using the token from the email link
 */
export async function POST(request: NextRequest) {
  // Rate limit: 10 attempts per 10 minutes per IP.
  // Practical brute-force risk is near-zero (32-char token, 36^32 entropy) but
  // having a limit is consistent with every other auth endpoint.
  const ip = getIP(request);
  const rl = checkRateLimit(`verify-email:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    // If the session user is already verified, treat as success without consuming
    // the token — handles re-clicks on old verification links gracefully.
    const sessionUser = await getCurrentUser();
    if (sessionUser?.emailVerified) {
      return NextResponse.json({ success: true });
    }

    const body = await request.json();
    const parsed = VerifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    const result = await verifyEmail(parsed.data.token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
