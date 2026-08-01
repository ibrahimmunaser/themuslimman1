import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/app/actions/profiles";
import { getProfileLimit, FAMILY_PROFILE_LIMIT, validateAvatar } from "@/lib/access";
import { checkRateLimit } from "@/lib/rate-limit";

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

    // This endpoint (and switch/[id]) had no rate limit at all before — a
    // buggy or malicious client with a valid session could otherwise hammer
    // profile creation indefinitely. Keyed by userId (not IP) since this is
    // always an authenticated request; 20/10min is generous for legitimate
    // one-time family setup while still bounding abuse.
    const rl = await checkRateLimit(`mobile-profiles-create:${user.id}`, 20, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
      );
    }

    const body = (await request.json()) as { displayName?: string; avatar?: unknown };
    const displayName = (body.displayName ?? "").trim();
    if (!displayName || displayName.length > 50) {
      return NextResponse.json({ error: "Name must be 1–50 characters." }, { status: 400 });
    }
    const avatarError = validateAvatar(body.avatar);
    if (avatarError) {
      return NextResponse.json({ error: avatarError }, { status: 400 });
    }
    const avatar = body.avatar as string | undefined;

    const planType = (user as { planType?: string }).planType ?? "individual";
    const profileLimit = getProfileLimit(planType);
    // Kept in lockstep with app/actions/profiles.ts's identical web-side
    // message wording — a user bouncing between web and app should never
    // notice a discrepancy here.
    const limitMsg =
      planType === "family"
        ? `Family Access allows up to ${profileLimit} learner profiles.`
        : `Your plan allows 1 learner profile. Upgrade to Family Access for up to ${FAMILY_PROFILE_LIMIT} profiles.`;

    // The count-then-create pattern used to run as two separate statements,
    // which left a window for two concurrent requests (e.g. a double-tap
    // that slips past the client's re-entrancy guard, or two family members
    // adding a profile at the same instant) to both read a count under the
    // limit and both insert, landing a family plan on 6+ profiles instead of
    // the intended 5. Serializable isolation makes Postgres abort one of the
    // two transactions with a serialization failure (P2034) instead of
    // letting both succeed; we retry that specific case since a retry will
    // correctly see the other transaction's committed row and reject.
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const profile = await prisma.$transaction(
          async (tx) => {
            const currentCount = await tx.learnerProfile.count({ where: { userId: user.id } });
            if (currentCount >= profileLimit) {
              throw new ProfileLimitError(limitMsg);
            }
            const duplicate = await tx.learnerProfile.findFirst({
              where: { userId: user.id, displayName: { equals: displayName, mode: "insensitive" } },
              select: { id: true },
            });
            if (duplicate) {
              throw new DuplicateProfileNameError();
            }
            return tx.learnerProfile.create({
              data: {
                id: crypto.randomUUID(),
                userId: user.id,
                displayName,
                avatar: avatar ?? null,
                isDefault: false,
              },
              select: { id: true, displayName: true, avatar: true, isDefault: true },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        return NextResponse.json({ success: true, profile });
      } catch (e) {
        if (e instanceof ProfileLimitError) {
          return NextResponse.json({ error: e.message }, { status: 403 });
        }
        if (e instanceof DuplicateProfileNameError) {
          return NextResponse.json(
            { error: "You already have a learner profile with this name." },
            { status: 400 },
          );
        }
        const isSerializationFailure =
          e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034";
        if (!isSerializationFailure || attempt === maxAttempts) throw e;
        // Brief backoff before retrying the losing transaction.
        await new Promise((r) => setTimeout(r, 50 * attempt));
      }
    }
    // Unreachable — the loop above always returns or throws.
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } catch (e) {
    console.error("[mobile-profiles] POST error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Internal signal used to short-circuit the transaction when the profile
 * limit is already reached, without letting Prisma treat it as a retryable
 * serialization failure. */
class ProfileLimitError extends Error {}

/** Internal signal used to short-circuit the transaction when another
 * profile on this account already has this display name (case-insensitive,
 * trimmed). Mirrors app/actions/profiles.ts's identical web-side check —
 * see its doc comment for rationale (Audit L-duplicate-profile-names). */
class DuplicateProfileNameError extends Error {}
