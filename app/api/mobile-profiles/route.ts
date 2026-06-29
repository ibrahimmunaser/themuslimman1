import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/app/actions/profiles";
import { getProfileLimit } from "@/lib/access";

/**
 * GET /api/mobile-profiles
 *
 * Returns all learner profiles for the current user, with the active profile
 * flagged. Used by the Flutter app's profile switcher.
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [profiles, activeProfileId] = await Promise.all([
      prisma.learnerProfile.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          displayName: true,
          avatar: true,
          isDefault: true,
          createdAt: true,
          _count: { select: { partProgress: true } },
        },
      }),
      getActiveProfileId(user.id),
    ]);

    const planType = (user as { planType?: string }).planType ?? "individual";
    const profileLimit = getProfileLimit(planType);

    return NextResponse.json({
      profiles: profiles.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        avatar: p.avatar,
        isDefault: p.isDefault,
        isActive: p.id === activeProfileId,
        partsStudied: p._count.partProgress,
      })),
      activeProfileId,
      profileLimit,
      canAddMore: profiles.length < profileLimit,
    });
  } catch (e) {
    console.error("[mobile-profiles] GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/mobile-profiles
 *
 * Creates a new learner profile. Body: { displayName, avatar? }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { displayName?: string; avatar?: string };
    const displayName = (body.displayName ?? "").trim();
    if (!displayName || displayName.length > 50) {
      return NextResponse.json({ error: "Name must be 1–50 characters." }, { status: 400 });
    }

    const planType = (user as { planType?: string }).planType ?? "individual";
    const profileLimit = getProfileLimit(planType);
    const currentCount = await prisma.learnerProfile.count({ where: { userId: user.id } });

    if (currentCount >= profileLimit) {
      const msg =
        planType === "family"
          ? `Family Access allows up to ${profileLimit} learner profiles.`
          : "Upgrade to Family Access to add more profiles.";
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    const profile = await prisma.learnerProfile.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        displayName,
        avatar: body.avatar ?? null,
        isDefault: false,
      },
      select: { id: true, displayName: true, avatar: true, isDefault: true },
    });

    return NextResponse.json({ success: true, profile });
  } catch (e) {
    console.error("[mobile-profiles] POST error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
