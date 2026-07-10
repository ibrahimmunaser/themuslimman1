import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/hash-token";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

const COOKIE_NAME = "seerah_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * POST /api/auth/mobile-anonymous
 *
 * Apple Guideline 5.1.1(v): the mobile app must let users buy an In-App
 * Purchase without registering with any personal information. Instead of
 * prompting for an email/password before checkout, the app calls this route
 * to silently provision a device-linked "guest" account with no personal
 * data collected, then proceeds straight to the StoreKit purchase sheet.
 *
 * Idempotent: if the caller already has a valid session (anonymous or real),
 * this just returns that identity — it never overwrites an existing account.
 *
 * The user can later call POST /api/auth/upgrade-account (fully optional) to
 * attach a real email/password to this same account and sync purchases
 * across devices, without losing anything already purchased.
 *
 * Responses:
 *  200 { success: true, isAnonymous, hasAccess, role, planType }
 *  429                — rate limited
 *  500                — server error
 */
export async function POST(request: NextRequest) {
  const ip = getIP(request);
  // Generous but bounded — this should only be hit once per fresh install,
  // plus occasional retries. Guards against automated abuse creating rows.
  const rl = checkRateLimit(`mobile-anon:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  try {
    // Already has a session (anonymous or real) — just report it, don't
    // create a second account for the same install.
    const existing = await getCurrentUser();
    if (existing) {
      const [hasAccess, dbUser] = await Promise.all([
        hasActiveCourseAccess(existing.id, existing.hasPaid),
        prisma.user.findUnique({ where: { id: existing.id }, select: { isAnonymous: true } }),
      ]);
      return NextResponse.json({
        success: true,
        isAnonymous: dbUser?.isAnonymous ?? false,
        hasAccess,
        role: existing.role,
        planType: existing.planType,
      });
    }

    const userId = crypto.randomUUID();
    // Synthetic, app-generated identifier — never shown to or collected from
    // the user. Not "personal information" under Guideline 5.1.1(v).
    const syntheticEmail = `guest-${userId}@device.themuslimman.com`;

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          updatedAt: new Date(),
          fullName: "Guest",
          email: syntheticEmail,
          passwordHash: null,
          role: "student",
          isAnonymous: true,
          emailVerified: false,
          studentProfile: {
            create: { id: crypto.randomUUID(), isActive: true, updatedAt: new Date() },
          },
        },
      });
    });

    const sessionToken = nanoid(48);
    const sessionExpiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);
    await prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        token: hashToken(sessionToken),
        expiresAt: sessionExpiresAt,
      },
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: sessionExpiresAt,
      path: "/",
    });
    cookieStore.set("seerah_role", "student", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: sessionExpiresAt,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      isAnonymous: true,
      hasAccess: false,
      role: "student",
      planType: "individual",
    });
  } catch (error) {
    console.error("[MOBILE_ANONYMOUS] Error:", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }
}
