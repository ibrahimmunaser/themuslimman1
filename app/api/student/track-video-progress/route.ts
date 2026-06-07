import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { trackVideoProgress } from "@/app/actions/progress";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { partNumber, watchPercent } = await req.json();
  if (!partNumber || watchPercent == null) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await trackVideoProgress(Number(partNumber), Number(watchPercent));
  return NextResponse.json({ ok: true });
}
