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

    // Find user with this removal token
    const user = await prisma.user.findFirst({
      where: { 
        parentVerificationToken: token,
        parentEmailVerified: true, // Only allow removal if email was verified
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/student/settings?error=invalid_token", process.env.NEXT_PUBLIC_APP_URL || "")
      );
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

    // Redirect to a success page
    return NextResponse.redirect(
      new URL("/parent-email-removed", process.env.NEXT_PUBLIC_APP_URL || "")
    );
  } catch (error) {
    console.error("Confirm removal error:", error);
    return NextResponse.redirect(
      new URL("/student/settings?error=removal_failed", process.env.NEXT_PUBLIC_APP_URL || "")
    );
  }
}
