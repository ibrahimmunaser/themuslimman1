import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setActiveProfileCookie } from "@/lib/auth";

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
