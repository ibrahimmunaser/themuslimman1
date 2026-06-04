import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";

export async function GET() {
  // Fire-and-forget click tracking — never block the redirect
  prisma.influencerClick.create({ data: { id: crypto.randomUUID(), creator: "theorthodoxmuslim" } }).catch(() => {});

  return NextResponse.redirect(
    `${APP_URL}/checkout?plan=individual&billing=lifetime&promo=ORTHODOX20&utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=theorthodoxmuslim`,
    { status: 302 }
  );
}
