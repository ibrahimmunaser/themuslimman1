import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { ticketId, status } = body;

    if (!ticketId || !status) {
      return NextResponse.json(
        { error: "Ticket ID and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["open", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return NextResponse.json(
      { error: "Failed to update ticket status" },
      { status: 500 }
    );
  }
}
