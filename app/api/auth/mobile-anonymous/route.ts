import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/hash-token";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import { setAuthCookies, SESSION_COOKIE_MAX_AGE_SECONDS } from "@/lib/session-cookies";

const COOKIE_MAX_AGE = SESSION_COOKIE_MAX_AGE_SECONDS;

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
 *  200 { success: true, isAnonymous, hasAccess, role, planType, fullName?, email? }
 *  429                — rate limited
 *  500                — server error
 */
export async function POST(request: NextRequest) {
  const ip = getIP(request);
  // Generous but bounded — this should only be hit once per fresh install,
  // plus occasional retries. Guards against automated abuse creating rows.
  const rl = await checkRateLimit(`mobile-anon:${ip}`, 20, 60 * 60 * 1000);
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
      const [access, dbUser] = await Promise.all([
        getUserAccessInfo(existing.id, existing.hasPaid),
        prisma.user.findUnique({
          where: { id: existing.id },
          select: { isAnonymous: true, emailVerified: true },
        }),
      ]);
      const isAnonymous = dbUser?.isAnonymous ?? false;
      return NextResponse.json({
        success: true,
        isAnonymous,
        hasAccess: access.hasAccess,
        role: existing.role,
        planType: existing.planType,
        // See /api/access/check's matching field doc — same "route Manage
        // Subscription to the right platform" purpose.
        purchasePlatform: access.purchasePlatform,
        // Audit M-reinstall-blank fix: this route is idempotent and silently
        // reuses an EXISTING session (see doc comment above) — critically,
        // that includes a REAL (named, password-protected) account, not just
        // guests. On iOS, Keychain-backed secure storage (where the session
        // cookie lives) commonly survives an app deletion/reinstall even
        // though every other on-device cache is wiped, so a real signed-in
        // user could reinstall, tap "Restore Purchases" (which calls
        // ensureSession() -> this route since AuthNotifier's local state was
        // wiped), and silently land back in their real account via this
        // branch. The caller (AuthNotifier._ensureSessionImpl) previously
        // built its UserModel from only the fields above, with no
        // name/email — so the Profile screen then showed a blank
        // name and "Student" instead of their real identity, even though
        // hasAccess/role/isAnonymous were all correct. Omitted for
        // anonymous accounts — their `email` is a synthetic
        // guest-*@device.themuslimman.com placeholder never meant to be
        // shown as if it were real user-entered data.
        ...(isAnonymous
          ? {}
          : {
              fullName: existing.fullName,
              email: existing.email,
              emailVerified: dbUser?.emailVerified ?? false,
            }),
      });
    }

    // Audit M-mobile-anon-limit: the per-IP key above is trivially bypassed
    // by rotating source IPs (residential proxy pool, botnet, or a
    // distributed script), and this route has no other identifying signal
    // to key on — it's deliberately called pre-auth with an empty body and
    // must stay that way (no personal info collection before purchase,
    // Apple Guideline 5.1.1(v)). Checked only on this actual account-CREATION
    // path (not the idempotent early-return above) so it can't be tripped by
    // ordinary high-frequency ensureSession() calls from already-provisioned
    // real users/guests. This is a coarse circuit breaker, not meant to catch
    // a single abusive IP (the per-IP limit above does that) — it caps how
    // many brand-new guest rows can be created globally per window no matter
    // how many source IPs a flood spreads across. The threshold is set well
    // above any plausible organic burst (e.g. a launch-day spike).
    const globalRl = await checkRateLimit("mobile-anon:global", 500, 5 * 60 * 1000);
    if (!globalRl.allowed) {
      console.warn(
        `[MOBILE_ANONYMOUS] Global guest-creation rate limit hit (500/5min) — possible distributed abuse. Triggering IP: ${ip}`,
      );
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(globalRl.retryAfterSeconds) } },
      );
    }

    const userId = crypto.randomUUID();
    // Synthetic, app-generated identifier — never shown to or collected from
    // the user. Not "personal information" under Guideline 5.1.1(v).
    const syntheticEmail = `guest-${userId}@device.themuslimman.com`;

    const sessionToken = nanoid(48);
    const sessionExpiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);

    // User + session in one transaction so a session-create failure never
    // leaves an orphaned guest row the client can't use (and a retry would
    // mint yet another guest).
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
      await tx.session.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          token: hashToken(sessionToken),
          expiresAt: sessionExpiresAt,
        },
      });
    });

    await setAuthCookies(sessionToken, "student", sessionExpiresAt);

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
