import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Minimal connectivity check — no business metrics exposed.
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({ status: "ok", database: "connected" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { status: "error", database: "unreachable", error: message },
      { status: 503 }
    );
  }
}
