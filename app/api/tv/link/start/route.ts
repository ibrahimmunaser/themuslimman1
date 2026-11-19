import { NextRequest, NextResponse } from "next/server";
import { customAlphabet, nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

export const maxDuration = 30;

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes — matches the on-screen countdown.

// Deliberately excludes 0/O and 1/I/L — this code is read off a TV screen
// from across a room and typed on a phone, so visually-ambiguous characters
// would just generate support tickets. 6 chars from this 29-char alphabet
// is ~34 bits of entropy, which combined with the rate limit on
// /api/tv/link/complete (where a code is actually "spent") is enough to
// resist blind guessing within the 10-minute window.
const codeAlphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const generateCode = customAlphabet(codeAlphabet, 6);

/**
 * POST /api/tv/link/start
 *
 * First step of the TV's "link with code" sign-in flow (the Netflix/
 * YouTube-TV pattern): the TV calls this with no auth of its own, gets back
 * a short human-enterable `code` to display, and a long secret
 * `deviceToken` it keeps to itself and uses to poll
 * /api/tv/link/poll — see the TvLinkCode model's doc comment in
 * schema.prisma for why those two are deliberately different values.
 *
 * No request body needed.
 *
 * Responses:
 *  200 { code, deviceToken, expiresAt }
 *  429 — rate limited
 *  500 — server error
 */
export async function POST(request: NextRequest) {
  const ip = getIP(request);
  // A real TV only needs to call this once per sign-in attempt (plus an
  // occasional retry if the code expires unused) — generous enough for
  // that, bounded against a script hammering this to flood the table.
  const rl = await checkRateLimit(`tv-link-start:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  try {
    const code = generateCode();
    const deviceToken = nanoid(32);
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await prisma.tvLinkCode.create({
      data: { code, deviceToken, expiresAt },
    });

    return NextResponse.json({ code, deviceToken, expiresAt });
  } catch (error) {
    console.error("[TV_LINK_START] Error:", error);
    return NextResponse.json(
      { error: "Could not start device linking. Please try again." },
      { status: 500 },
    );
  }
}
