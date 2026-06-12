import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/hash-token";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

const COOKIE_NAME = "seerah_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const GuestCheckoutSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
});

async function createInlineSession(userId: string, role: string) {
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
  cookieStore.set("seerah_role", role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: sessionExpiresAt,
    path: "/",
  });
}

/**
 * POST /api/auth/guest-checkout
 *
 * Creates (or re-uses) a password-less guest account so the user can proceed
 * straight to payment without choosing a password upfront. After purchase the
 * webhook / trial-intent route sends them a "set your password" email.
 *
 * Responses:
 *  200  { success: true }         — account ready, session cookie set
 *  409  { hasAccount: true, ... } — email exists with a real password; prompt login
 *  400 / 429 / 500               — validation / rate-limit / server error
 */
export async function POST(request: NextRequest) {
  const ip = getIP(request);
  const rl = checkRateLimit(`guest-checkout:${ip}`, 10, 15 * 60 * 1000);
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

    const { email, fullName } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

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
      // Guest account (no password yet) — just create a fresh session
      await createInlineSession(existing.id, existing.role);
      return NextResponse.json({ success: true });
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
