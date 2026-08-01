import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/hash-token";
import { setAuthCookies, SESSION_COOKIE_MAX_AGE_SECONDS } from "@/lib/session-cookies";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

/**
 * GET /api/auth/confirm-checkout?token=...&plan=...
 *
 * Completes the "resume existing guest account" step started by
 * /api/auth/guest-checkout. Clicking this link (sent only to the account's
 * own inbox) is the proof-of-ownership that lets us safely grant a session,
 * closing the account-takeover hole where anyone could type in a matching
 * email and get logged in instantly.
 */
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function GET(request: NextRequest) {
  const ip = getIP(request);
  const rl = await checkRateLimit(`confirm-checkout:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  const plan = searchParams.get("plan");

  const failUrl = new URL("/checkout", origin);
  failUrl.searchParams.set("confirmError", "1");
  if (plan) failUrl.searchParams.set("plan", plan);

  if (!token) {
    return NextResponse.redirect(failUrl);
  }

  const checkoutHash = hashToken(`checkout:${token}`);

  // Primary: passwordResetToken (when no setup: token was preserved).
  // Fallback: verificationToken (checkout parked there to avoid clobbering setup:).
  let user = await prisma.user.findFirst({
    where: { passwordResetToken: checkoutHash },
    select: {
      id: true,
      role: true,
      passwordResetExpiry: true,
      verificationToken: true,
      verificationExpires: true,
    },
  });

  let tokenSlot: "passwordReset" | "verification" = "passwordReset";
  if (user) {
    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      return NextResponse.redirect(failUrl);
    }
  } else {
    user = await prisma.user.findFirst({
      where: { verificationToken: checkoutHash },
      select: {
        id: true,
        role: true,
        passwordResetExpiry: true,
        verificationToken: true,
        verificationExpires: true,
      },
    });
    if (!user || !user.verificationExpires || user.verificationExpires < new Date()) {
      return NextResponse.redirect(failUrl);
    }
    tokenSlot = "verification";
  }

  // Single-use: clear the checkout confirm token immediately.
  // Revoke ALL existing sessions so a squatter who created the guest row
  // cannot keep a parallel session after the real owner confirms.
  // Never clear passwordResetToken when confirm lived on verificationToken
  // (that slot may still hold a long-lived setup: token).
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data:
        tokenSlot === "passwordReset"
          ? { passwordResetToken: null, passwordResetExpiry: null }
          : { verificationToken: null, verificationExpires: null },
    }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);

  const sessionToken = nanoid(48);
  const sessionExpiresAt = new Date(Date.now() + SESSION_COOKIE_MAX_AGE_SECONDS * 1000);
  await prisma.session.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      token: hashToken(sessionToken),
      expiresAt: sessionExpiresAt,
    },
  });
  await setAuthCookies(sessionToken, user.role, sessionExpiresAt);

  const successUrl = new URL("/checkout", origin);
  successUrl.searchParams.set("confirmed", "1");
  if (plan) successUrl.searchParams.set("plan", plan);
  return NextResponse.redirect(successUrl);
}
