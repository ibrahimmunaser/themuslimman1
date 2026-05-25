import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";

export async function GET() {
  // Fire-and-forget click tracking — never block the redirect
  prisma.influencerClick.create({ data: { creator: "itachi" } }).catch(() => {});

  return NextResponse.redirect(
    `${APP_URL}/pricing?utm_source=tiktok&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=itachi&promo=ITACHI20`,
    { status: 302 }
  );
}
