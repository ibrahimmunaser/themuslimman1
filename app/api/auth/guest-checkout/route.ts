import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/hash-token";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import {
  setAuthCookies,
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
} from "@/lib/session-cookies";

const GuestCheckoutSchema = z.object({
  email:    z.string().email("Please enter a valid email address"),
  fullName: z.string().trim().max(100).optional(),
  // Current plan selection, forwarded into the confirmation-email link so the
  // user lands back on the same plan after clicking it (best-effort only).
  audience: z.enum(["individual", "family"]).optional(),
  billing:  z.enum(["monthly", "lifetime"]).optional(),
});

async function createInlineSession(userId: string, role: string) {
  const sessionToken = nanoid(48);
  const sessionExpiresAt = new Date(Date.now() + SESSION_COOKIE_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      token: hashToken(sessionToken),
      expiresAt: sessionExpiresAt,
    },
  });

  // Shared helper — see lib/session-cookies.ts. This route used to hand-roll
  // its own {httpOnly, secure, sameSite, expires, path} cookie block instead
  // of using the app's single consolidated implementation, so any future
  // cookie hardening applied there (e.g. tightening sameSite) could easily
  // have been missed here.
  await setAuthCookies(sessionToken, role, sessionExpiresAt);
}

async function sendCheckoutConfirmationEmail(
  email: string,
  fullName: string,
  rawToken: string,
  plan?: string,
) {
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/confirm-checkout?token=${rawToken}${plan ? `&plan=${encodeURIComponent(plan)}` : ""}`;
  const safeName = fullName
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "TheMuslimMan <noreply@themuslimman.com>",
      to: email,
      subject: "Confirm it's you — Complete Seerah checkout",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, sans-serif; background:#0b0f14; padding:32px; color:#e5e7eb;">
            <div style="max-width:480px; margin:0 auto; background:#141a21; border-radius:12px; padding:32px;">
              <h2 style="color:#fff; margin-top:0;">Assalamu alaikum${safeName ? " " + safeName : ""},</h2>
              <p>Someone (hopefully you) started checkout on Complete Seerah using this email address. Click below to confirm it's you and continue to payment:</p>
              <p style="text-align:center; margin:32px 0;">
                <a href="${confirmUrl}" style="background:#d4af37; color:#000; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:600;">Continue Checkout</a>
              </p>
              <p style="color:#9ca3af; font-size:13px;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email — no account changes were made.</p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("[GUEST_CHECKOUT] Failed to send confirmation email:", error);
    throw error;
  }
}

/**
 * POST /api/auth/guest-checkout
 *
 * Creates (or re-uses) a password-less guest account so the user can proceed
 * straight to payment without choosing a password upfront. After purchase the
 * webhook / trial-intent route sends them a "set your password" email.
 *
 * SECURITY: this endpoint used to grant a full authenticated session to
 * *anyone* who typed in an email address matching an existing passwordless
 * guest account — since checkout auto-triggers this on blur, simply typing a
 * stranger's email into the checkout form was a full account takeover (their
 * purchases, progress, family profiles, everything). Brand-new emails are
 * still instant (nothing to steal yet), but resuming an *existing* guest
 * account now requires either (a) the caller already holding a valid session
 * for that exact account, or (b) clicking a confirmation link emailed to that
 * address — see /api/auth/confirm-checkout.
 *
 * Responses:
 *  200  { success: true }              — account ready, session cookie set
 *  200  { requiresConfirmation: true } — existing guest account; confirmation email sent
 *  409  { hasAccount: true, ... }      — email exists with a real password; prompt login
 *  400 / 429 / 500                    — validation / rate-limit / server error
 */
export async function POST(request: NextRequest) {
  const ip = getIP(request);
  const rl = await checkRateLimit(`guest-checkout:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = GuestCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, fullName: rawName, audience, billing } = parsed.data;
    const plan = audience && billing ? `${audience}-${billing}` : undefined;
    const normalizedEmail = email.toLowerCase().trim();
    // Derive a display name from the email prefix when the user doesn't provide one.
    const fullName = rawName?.trim() || normalizedEmail.split("@")[0] || "Student";

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, role: true, passwordHash: true },
    });

    if (existing) {
      if (existing.passwordHash) {
        // Real account — they need to sign in with their password
        return NextResponse.json(
          {
            error: "An account with this email already exists. Please sign in.",
            hasAccount: true,
          },
          { status: 409 }
        );
      }

      // Guest account (no password yet). Only auto-resume it if the caller
      // already holds a valid session for this exact account (e.g. a page
      // refresh or a retry) — never for an anonymous caller who merely
      // supplied a matching email.
      const incomingToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (incomingToken) {
        const incomingSession = await prisma.session.findUnique({
          where: { token: hashToken(incomingToken) },
          select: { userId: true, expiresAt: true },
        });
        if (
          incomingSession &&
          incomingSession.userId === existing.id &&
          incomingSession.expiresAt > new Date()
        ) {
          return NextResponse.json({ success: true });
        }
      }

      // No matching session — require proof of email ownership before
      // resuming this account. Rate-limit per-email too, so an attacker
      // can't use this to spam a victim's inbox from rotating IPs.
      const emailRl = await checkRateLimit(`guest-checkout-confirm:${normalizedEmail}`, 3, 15 * 60 * 1000);
      if (!emailRl.allowed) {
        // Don't reveal the real reason — same shape as a normal send.
        return NextResponse.json({ requiresConfirmation: true });
      }

      const rawToken = nanoid(32);
      // Don't clobber a long-lived setup: token (48h). Checkout confirm is 15m;
      // store checkout tokens on passwordResetToken when free, otherwise on
      // verificationToken so we always have a usable confirm link to email.
      const tokenState = await prisma.user.findUnique({
        where: { id: existing.id },
        select: { passwordResetToken: true, passwordResetExpiry: true },
      });
      const remainingMs = tokenState?.passwordResetExpiry
        ? tokenState.passwordResetExpiry.getTime() - Date.now()
        : 0;
      const hasLongLivedSetupToken =
        !!tokenState?.passwordResetToken &&
        remainingMs > 20 * 60 * 1000;

      const checkoutHash = hashToken(`checkout:${rawToken}`);
      const checkoutExpiry = new Date(Date.now() + 15 * 60 * 1000);

      if (!hasLongLivedSetupToken) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            passwordResetToken: checkoutHash,
            passwordResetExpiry: checkoutExpiry,
          },
        });
      } else {
        // Preserve setup: on passwordResetToken; park checkout confirm on
        // verificationToken + verificationExpires (15m). Guests are unverified
        // and won't have a pending verify email at this stage.
        console.log(`[GUEST_CHECKOUT] Preserving setup token for ${existing.id}; checkout confirm → verificationToken`);
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            verificationToken: checkoutHash,
            verificationExpires: checkoutExpiry,
          },
        });
      }

      try {
        await sendCheckoutConfirmationEmail(normalizedEmail, fullName, rawToken, plan);
      } catch {
        return NextResponse.json(
          { error: "Failed to send confirmation email. Please try again." },
          { status: 500 }
        );
      }

      return NextResponse.json({ requiresConfirmation: true });
    }

    // Brand-new guest account
    const userId = crypto.randomUUID();
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          updatedAt: new Date(),
          fullName: fullName.trim(),
          email: normalizedEmail,
          passwordHash: null,
          role: "student",
          emailVerified: false,
          studentProfile: {
            create: {
              id: crypto.randomUUID(),
              isActive: true,
              updatedAt: new Date(),
            },
          },
        },
      });
    });

    await createInlineSession(userId, "student");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GUEST_CHECKOUT] Error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
