import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

export const maxDuration = 15;

/**
 * GET /api/tv/link/poll?deviceToken=...
 *
 * The TV calls this every few seconds after /api/tv/link/start while it's
 * showing the code on screen. `deviceToken` (not `code`) is the credential
 * here — see the TvLinkCode model's doc comment in schema.prisma.
 *
 * Responses:
 *  200 { status: "pending" }
 *  200 { status: "linked", sessionToken, fullName } — sessionToken is
 *      then cleared from the DB row so a replayed/leaked poll request
 *      can't fetch it a second time; the TV must store it (it plays the
 *      exact role the "seerah_session" cookie plays for the phone
 *      app/website — send it back as `Cookie: seerah_session=<token>` on
 *      every future API call).
 *  200 { status: "expired" }
 *  404 — unknown deviceToken (never started here, or already expired and
 *      cleaned up)
 *  429 — rate limited
 */
export async function GET(request: NextRequest) {
  const ip = getIP(request);
  // Generous for legitimate polling (every ~2-3s for up to 10 minutes is
  // ~200-300 calls); still bounded against a script hammering this per IP.
  const rl = await checkRateLimit(`tv-link-poll:${ip}`, 400, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const deviceToken = request.nextUrl.searchParams.get("deviceToken");
  if (!deviceToken) {
    return NextResponse.json({ error: "deviceToken is required" }, { status: 400 });
  }

  try {
    const row = await prisma.tvLinkCode.findUnique({ where: { deviceToken } });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (row.expiresAt < new Date()) {
      // Best-effort cleanup — a failed delete here just leaves a harmless
      // expired row for the cron-style sweep other short-lived tables in
      // this codebase already get (see cleanup-abandoned-guests) to catch
      // later; it must never fail the response to the TV.
      prisma.tvLinkCode.delete({ where: { deviceToken } }).catch(() => undefined);
      return NextResponse.json({ status: "expired" });
    }

    if (row.status === "linked") {
      // Already delivered on a previous poll (sessionToken cleared below the
      // first time through). Still report "linked" — not "pending" — so a
      // near-simultaneous duplicate poll, or one retried after a dropped
      // response, doesn't make the TV think it should keep waiting forever;
      // just omit the one-time token since it's already been handed out.
      if (!row.sessionToken) {
        return NextResponse.json({ status: "linked", sessionToken: null, fullName: null });
      }

      const sessionToken = row.sessionToken;
      const user = row.userId
        ? await prisma.user.findUnique({ where: { id: row.userId }, select: { fullName: true } })
        : null;
      // One-time delivery: clear the token (not the whole row, so a
      // near-simultaneous duplicate poll still reads "linked" instead of a
      // confusing 404) immediately after reading it.
      await prisma.tvLinkCode.update({
        where: { deviceToken },
        data: { sessionToken: null },
      });
      return NextResponse.json({ status: "linked", sessionToken, fullName: user?.fullName ?? null });
    }

    return NextResponse.json({ status: "pending" });
  } catch (error) {
    console.error("[TV_LINK_POLL] Error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
