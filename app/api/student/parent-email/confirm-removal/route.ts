import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/hash-token";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://seerah.themuslimman.com";


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/student/settings?error=invalid_token", APP_URL));
    }

    // Hash the raw token before DB lookup — tokens are stored as hashes.
    const user = await prisma.user.findFirst({
      where: { 
        parentVerificationToken: hashToken(token),
        parentEmailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/student/settings?error=invalid_token", APP_URL));
    }

    // Remove parent email and clear verification
    await prisma.user.update({
      where: { id: user.id },
      data: {
        parentEmail: null,
        parentEmailVerified: false,
        parentVerificationToken: null,
        sendWeeklyReports: false,
      },
    });

    console.log(`[EMAIL] Parent email removed for user ${user.id}`);

    return NextResponse.redirect(new URL("/parent-email-removed", APP_URL));
  } catch (error) {
    console.error("Confirm removal error:", error);
    return NextResponse.redirect(new URL("/student/settings?error=removal_failed", APP_URL));
  }
}
