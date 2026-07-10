import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/hash-token";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

const generateToken = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 32);

const UpgradeSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(1000, "Password is too long"),
});

/**
 * POST /api/auth/upgrade-account
 *
 * Optional, user-initiated upgrade of a mobile guest/anonymous account
 * (created by /api/auth/mobile-anonymous) into a real email/password
 * account — Apple Guideline 5.1.1(v) requires this to be entirely optional
 * and available "at any time", never required before or immediately after
 * purchase.
 *
 * Crucially this updates the SAME User row in place (same id), so every
 * MobilePurchase / Subscription / progress record already tied to this
 * account stays attached — nothing is re-linked or lost. This is what lets
 * the user access their purchase from another device after upgrading.
 *
 * Responses:
 *  200 { success: true }                     — upgraded, still signed in
 *  400                                        — validation error / already a real account
 *  401                                        — no active session
 *  409 { error, hasAccount: true }            — email already used by another account
 */
export async function POST(request: NextRequest) {
  const ip = getIP(request);
  const rl = checkRateLimit(`upgrade-account:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = UpgradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }
    const { fullName, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, isAnonymous: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (!dbUser.isAnonymous) {
      return NextResponse.json(
        { error: "This account already has a real email and password. Use Change Password instead." },
        { status: 400 },
      );
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingEmail && existingEmail.id !== dbUser.id) {
      return NextResponse.json(
        {
          error: "An account with this email already exists. Please sign in instead — you can restore your purchase after signing in.",
          hasAccount: true,
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const isDevelopment = process.env.NODE_ENV !== "production";
    const rawVerificationToken = isDevelopment ? null : generateToken();
    const verificationToken = rawVerificationToken ? hashToken(rawVerificationToken) : null;
    const verificationExpires = isDevelopment ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        isAnonymous: false,
        emailVerified: isDevelopment,
        verificationToken,
        verificationExpires,
      },
    });

    if (!isDevelopment && rawVerificationToken) {
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${rawVerificationToken}`;
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "TheMuslimMan <noreply@themuslimman.com>",
          to: normalizedEmail,
          subject: "Verify your email — Complete Seerah",
          html: `
            <!DOCTYPE html>
            <html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: #f4c542; margin: 0; font-size: 24px;">Welcome, ${fullName.trim()}</h1>
              </div>
              <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e5e5; border-top: none;">
                <p style="font-size: 16px;">Your account is now linked to this email. Verify it to enable password resets and signing in from other devices:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" style="display: inline-block; background: #f4c542; color: #1a1a1a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600;">Verify Email</a>
                </div>
              </div>
            </body></html>
          `,
        });
      } catch (emailError) {
        console.error("[UPGRADE_ACCOUNT] Failed to send verification email:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[UPGRADE_ACCOUNT] Error:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Could not create account. Please try again." },
      { status: 500 },
    );
  }
}
