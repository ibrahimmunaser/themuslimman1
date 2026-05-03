import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await requireStudent();
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
