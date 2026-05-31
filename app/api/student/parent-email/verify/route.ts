import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/student/settings?error=invalid_token", process.env.NEXT_PUBLIC_APP_URL || "")
      );
    }

    // Find user with this verification token
    const user = await prisma.user.findUnique({
      where: { parentVerificationToken: token },
    });

    if (!user || !user.parentEmail) {
      return NextResponse.redirect(
        new URL("/student/settings?error=invalid_token", process.env.NEXT_PUBLIC_APP_URL || "")
      );
    }

    // Mark parent email as verified and clear the token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        parentEmailVerified: true,
        parentVerificationToken: null,
      },
    });

    console.log(`[EMAIL] Parent email verified for user ${user.id}: ${user.parentEmail}`);

    // Redirect to a success page
    return NextResponse.redirect(
      new URL("/parent-email-verified", process.env.NEXT_PUBLIC_APP_URL || "")
    );
  } catch (error) {
    console.error("Parent email verification error:", error);
    return NextResponse.redirect(
      new URL("/student/settings?error=verification_failed", process.env.NEXT_PUBLIC_APP_URL || "")
    );
  }
}
