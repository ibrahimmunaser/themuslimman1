import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const email = "ibrahimmunaser2@gmail.com";

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const deleted = await prisma.purchase.deleteMany({
      where: { userId: user.id },
    });

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
