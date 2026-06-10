import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { sendWeeklyReports } = await request.json();

    if (!user.parentEmail || !user.parentEmailVerified) {
      return NextResponse.json(
        { error: "No verified parent email found" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        sendWeeklyReports: !!sendWeeklyReports,
      },
    });

    console.log(`[SETTINGS] Weekly reports ${sendWeeklyReports ? "enabled" : "disabled"} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      sendWeeklyReports: !!sendWeeklyReports,
    });
  } catch (error) {
    console.error("Toggle reports error:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
