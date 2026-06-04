import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/hash-token";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://seerah.themuslimman.com";


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/parent-email-verified?error=invalid_token", APP_URL));
    }

    // Hash the incoming token before DB lookup (tokens are stored as hashes).
    const user = await prisma.user.findUnique({
      where: { parentVerificationToken: hashToken(token) },
    });

    if (!user || !user.parentEmail) {
      return NextResponse.redirect(new URL("/parent-email-verified?error=invalid_token", APP_URL));
    }

    // Mark parent email as verified and clear the token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        parentEmailVerified: true,
        parentVerificationToken: null,
      },
    });

    console.log(`[EMAIL] Parent email verified for user ${user.id}`);

    // Redirect to a success page
    return NextResponse.redirect(new URL("/parent-email-verified", APP_URL));
  } catch (error) {
    console.error("Parent email verification error:", error);
    return NextResponse.redirect(new URL("/parent-email-verified?error=verification_failed", APP_URL));
  }
}
