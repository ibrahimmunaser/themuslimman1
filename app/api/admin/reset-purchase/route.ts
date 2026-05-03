import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Temporary endpoint to reset test purchases
export async function POST(request: NextRequest) {
  try {
    // Hardcode test email for simplicity
    const email = "ibrahimmunaser2@gmail.com";

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete all purchases for this user
    const deleted = await prisma.purchase.deleteMany({
      where: { userId: user.id },
    });

    // Reset hasPaid flag
    await prisma.user.update({
      where: { id: user.id },
      data: { hasPaid: false },
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count,
      message: `Deleted ${deleted.count} purchase(s) for ${email}`,
    });
  } catch (error) {
    console.error("Error resetting purchase:", error);
    return NextResponse.json(
      { error: "Failed to reset purchase" },
      { status: 500 }
    );
  }
}
