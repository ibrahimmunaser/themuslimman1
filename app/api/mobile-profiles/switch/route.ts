import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setActiveProfileCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/mobile-profiles/switch
 *
 * Switches the active learner profile.
 * Body: { profileId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Switching is a normal, frequent action (e.g. tapping between profiles
    // on a shared family device), so this is a much looser cap than
    // create/delete/patch — just enough to stop a runaway client loop.
    const rl = await checkRateLimit(`mobile-profiles-switch:${user.id}`, 60, 5 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
      );
    }

    const body = (await request.json()) as { profileId?: string };
    const profileId = body.profileId;
    if (!profileId) {
      return NextResponse.json({ error: "profileId is required." }, { status: 400 });
    }

    const profile = await prisma.learnerProfile.findFirst({
      where: { id: profileId, userId: user.id },
      select: { id: true, displayName: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    await setActiveProfileCookie(profile.id);

    return NextResponse.json({ success: true, activeProfileId: profile.id, displayName: profile.displayName });
  } catch (e) {
    console.error("[mobile-profiles/switch] POST error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
