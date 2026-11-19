import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/hash-token";
import { getUserAccessInfo } from "@/lib/access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import { SESSION_COOKIE_MAX_AGE_SECONDS } from "@/lib/session-cookies";

export const maxDuration = 30;

// Fixed dummy hash so bcrypt.compare() always runs the same cost (rounds=12)
// whether or not the email exists / has a password set — matches the
// not-found/no-password branches in lib/auth.ts's login(), kept in sync so
// a timing difference can't be used to enumerate accounts.
const DUMMY_HASH = "$2b$12$TKYwTM5YiNrZ.CQshX1m.OuolC6Pbw8AMMTTbWyJe6TGTQiWAXb7e";

/**
 * POST /api/tv/auth/signin
 *
 * Email/password sign-in for the TV app's on-screen-keyboard path (the
 * alternative to /api/tv/link/* device-code linking). Deliberately a
 * separate route from /api/auth/signin rather than reusing lib/auth.ts's
 * login():
 *
 *   1. login() calls prisma.session.deleteMany({ userId }) before creating
 *      its new session — "signing in anywhere logs you out everywhere
 *      else" is the right model for a single browser, but would mean
 *      typing your password into the TV silently signs you out of your
 *      phone and the website. Each device should get its own session.
 *   2. login() sets the result straight into this *request's* httpOnly
 *      cookie via createSession() -> setAuthCookies(). The TV has no
 *      cookie jar; it needs the raw token back in the JSON body instead
 *      (same pattern /api/tv/link/complete uses to hand a token to the
 *      TV through the TvLinkCode row).
 *
 * Body: { email: string, password: string }
 *
 * Responses:
 *  200 { success: true, sessionToken, fullName, hasAccess }
 *  401 { error } — invalid email or password
 *  429 — rate limited
 */
export async function POST(request: NextRequest) {
  const ip = getIP(request);
  const rl = await checkRateLimit(`tv-signin:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive || !user.passwordHash) {
      await bcrypt.compare(password, DUMMY_HASH);
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const sessionToken = nanoid(48);
    const expiresAt = new Date(Date.now() + SESSION_COOKIE_MAX_AGE_SECONDS * 1000);

    await prisma.$transaction([
      prisma.session.create({
        data: {
          id: nanoid(24),
          userId: user.id,
          token: hashToken(sessionToken),
          expiresAt,
        },
      }),
      prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
    ]);

    const access = await getUserAccessInfo(user.id, user.hasPaid);

    return NextResponse.json({
      success: true,
      sessionToken,
      fullName: user.fullName,
      hasAccess: access.hasAccess,
    });
  } catch (error) {
    console.error("[TV_AUTH_SIGNIN] Error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
