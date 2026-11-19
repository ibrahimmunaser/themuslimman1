import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/hash-token";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import { SESSION_COOKIE_MAX_AGE_SECONDS } from "@/lib/session-cookies";

export const maxDuration = 15;

/**
 * POST /api/tv/link/complete
 *
 * Called from the browser (themuslimman.com/activate) by a user who is
 * ALREADY signed in there and has just typed in the code shown on their TV.
 * Mints a brand new Session row for their account and hands its raw token
 * to the waiting TV via the TvLinkCode row, for /api/tv/link/poll to pick up.
 *
 * Deliberately does NOT call setAuthCookies()/createSession() — those
 * would overwrite *this* request's own browser session cookie with the
 * newly minted token, which is unnecessary (the browser is already signed
 * in) and would be a confusing side effect of an action that's conceptually
 * about a different device.
 *
 * Body: { code: string }
 *
 * Responses:
 *  200 { success: true }
 *  400 — missing/invalid/expired/already-used code
 *  401 — caller isn't signed in on the web
 *  429 — rate limited
 */
export async function POST(request: NextRequest) {
  const ip = getIP(request);
  // Tight: this is the one place a guessed `code` actually gets "spent",
  // so it's the real defense against blind guessing within the 10-minute
  // window (6 chars from a 32-char alphabet = ~34 bits — fine against 10
  // attempts/10min, not fine against an unbounded script).
  const rl = await checkRateLimit(`tv-link-complete:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const rawCode = typeof body?.code === "string" ? body.code : null;
    if (!rawCode) {
      return NextResponse.json({ error: "Code is required." }, { status: 400 });
    }
    // Forgiving of how the user typed it back — dashes/spaces/lowercase —
    // since the TV displays it in a fixed, dash-free uppercase format but
    // people habitually "chunk" codes when reading them aloud or typing.
    const code = rawCode.replace(/[\s-]/g, "").toUpperCase();

    const row = await prisma.tvLinkCode.findUnique({ where: { code } });
    if (!row || row.status !== "pending" || row.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "That code is invalid or has expired. Generate a new one on your TV." },
        { status: 400 },
      );
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
      prisma.tvLinkCode.update({
        where: { code },
        data: { status: "linked", sessionToken, userId: user.id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TV_LINK_COMPLETE] Error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
