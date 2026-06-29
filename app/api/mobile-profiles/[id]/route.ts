import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * DELETE /api/mobile-profiles/[id]
 *
 * Deletes a learner profile. The default profile and last remaining profile
 * cannot be deleted.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: profileId } = await params;

    const existing = await prisma.learnerProfile.findFirst({
      where: { id: profileId, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    if (existing.isDefault) return NextResponse.json({ error: "Cannot delete the default profile." }, { status: 400 });

    const total = await prisma.learnerProfile.count({ where: { userId: user.id } });
    if (total <= 1) return NextResponse.json({ error: "Must keep at least one profile." }, { status: 400 });

    await prisma.learnerProfile.delete({ where: { id: profileId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[mobile-profiles/[id]] DELETE error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/mobile-profiles/[id]
 *
 * Updates a profile's displayName and/or avatar.
 * Body: { displayName?: string, avatar?: string | null }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: profileId } = await params;
    const body = (await request.json()) as { displayName?: string; avatar?: string | null };

    const existing = await prisma.learnerProfile.findFirst({
      where: { id: profileId, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

    if (body.displayName !== undefined) {
      const trimmed = body.displayName.trim();
      if (!trimmed || trimmed.length > 50) {
        return NextResponse.json({ error: "Name must be 1–50 characters." }, { status: 400 });
      }
      body.displayName = trimmed;
    }

    await prisma.learnerProfile.update({
      where: { id: profileId },
      data: { displayName: body.displayName, avatar: body.avatar },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[mobile-profiles/[id]] PATCH error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
