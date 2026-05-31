import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";

export async function GET() {
  prisma.influencerClick.create({ data: { id: crypto.randomUUID(), creator: "dearborn" } }).catch(() => {});

  return NextResponse.redirect(
    `${APP_URL}/checkout?promo=DEARBORN20`,
    { status: 302 }
  );
}
