import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { getCurrentUser, clearActiveProfileCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateAvatar } from "@/lib/access";

const PROFILE_COOKIE = "seerah_profile";

/** Internal signal used to short-circuit the delete transaction when this
 * would be the last remaining profile, without letting Prisma treat it as a
 * retryable serialization failure. */
class LastProfileError extends Error {}

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

    // Same rationale as the create-route limit — this had no rate limit at
    // all previously.
    const rl = await checkRateLimit(`mobile-profiles-delete:${user.id}`, 20, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
      );
    }

    const { id: profileId } = await params;

    const existing = await prisma.learnerProfile.findFirst({
      where: { id: profileId, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    if (existing.isDefault) return NextResponse.json({ error: "Cannot delete the default profile." }, { status: 400 });

    // Same race as the mobile profile-creation POST route, mirrored for
    // deletion: count-then-delete as two separate statements let two
    // concurrent DELETEs (e.g. a double-tap slipping past the client's
    // re-entrancy guard, or two family members deleting different profiles
    // at once) both pass the "more than 1 left" check before either
    // commits, potentially dropping the account to 0 profiles. Serializable
    // isolation + retry closes the same window the create-side fix closed.
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await prisma.$transaction(
          async (tx) => {
            const total = await tx.learnerProfile.count({ where: { userId: user.id } });
            if (total <= 1) {
              throw new LastProfileError();
            }
            await tx.learnerProfile.delete({ where: { id: profileId } });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        break;
      } catch (e) {
        if (e instanceof LastProfileError) {
          return NextResponse.json({ error: "Must keep at least one profile." }, { status: 400 });
        }
        const isSerializationFailure =
          e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034";
        if (!isSerializationFailure || attempt === maxAttempts) throw e;
        await new Promise((r) => setTimeout(r, 50 * attempt));
      }
    }

    // Clear the stale active-profile cookie if it pointed at the profile we
    // just deleted, so the next /api/mobile-profiles fetch (which the
    // Flutter client always does right after a delete) reports the
    // server's fallback default profile as active rather than briefly
    // re-validating a dangling cookie value.
    const cookieStore = await cookies();
    if (cookieStore.get(PROFILE_COOKIE)?.value === profileId) {
      await clearActiveProfileCookie();
    }

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

    // Same rationale as the create-route limit — this had no rate limit at
    // all previously.
    const rl = await checkRateLimit(`mobile-profiles-patch:${user.id}`, 30, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
      );
    }

    const { id: profileId } = await params;
    const body = (await request.json()) as { displayName?: string; avatar?: unknown };

    const existing = await prisma.learnerProfile.findFirst({
      where: { id: profileId, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

    if (body.displayName !== undefined) {
      const trimmed = body.displayName.trim();
      if (!trimmed || trimmed.length > 50) {
        return NextResponse.json({ error: "Name must be 1–50 characters." }, { status: 400 });
      }
      // Mirrors app/actions/profiles.ts's web-side updateProfile check
      // (Audit L-duplicate-profile-names).
      const duplicate = await prisma.learnerProfile.findFirst({
        where: {
          userId: user.id,
          id: { not: profileId },
          displayName: { equals: trimmed, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "You already have a learner profile with this name." },
          { status: 400 },
        );
      }
      body.displayName = trimmed;
    }
    if (body.avatar !== undefined) {
      const avatarError = validateAvatar(body.avatar);
      if (avatarError) {
        return NextResponse.json({ error: avatarError }, { status: 400 });
      }
    }

    await prisma.learnerProfile.update({
      where: { id: profileId },
      data: { displayName: body.displayName, avatar: body.avatar as string | null | undefined },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[mobile-profiles/[id]] PATCH error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
