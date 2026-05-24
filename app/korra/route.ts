import { NextResponse } from "next/server";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://seerah.themuslimman.com";

export async function GET() {
  return NextResponse.redirect(
    `${APP_URL}/?utm_source=tiktok&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=korra&promo=KORRA20`,
    { status: 302 }
  );
}
