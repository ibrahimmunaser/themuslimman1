import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(
    "https://themuslimman.com/?utm_source=tiktok&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=itachi&promo=ITACHI20",
    { status: 302 }
  );
}
