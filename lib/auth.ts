"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "./db";
import { hashToken } from "./hash-token";
import type { SessionUser } from "./session";
import { ROLES, type Role, isRole } from "./roles";

const COOKIE_NAME    = "seerah_session";
// seerah_role is a UI-hint cookie (now httpOnly). It is NEVER used for access
// control decisions on the server — all authorization uses the DB session lookup
// in getCurrentUser(). This cookie only informs client-side UI like nav items.
const ROLE_COOKIE    = "seerah_role";
const PROFILE_COOKIE = "seerah_profile"; // active learner profile ID (non-httpOnly for client reads)
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const BCRYPT_ROUNDS  = 12;

// ─────────────────────────────────────────────────────────────
// Session helpers
// ─────────────────────────────────────────────────────────────

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

async function setRoleCookie(role: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(ROLE_COOKIE, role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(ROLE_COOKIE);
  cookieStore.delete(PROFILE_COOKIE);
}

// ─────────────────────────────────────────────────────────────
// Profile cookie helpers — called by profile server actions
// ─────────────────────────────────────────────────────────────

export async function setActiveProfileCookie(profileId: string) {
  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);
  cookieStore.set(PROFILE_COOKIE, profileId, {
    httpOnly: false, // readable client-side to display active profile name
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearActiveProfileCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(PROFILE_COOKIE);
}

async function createSession(userId: string, role: string): Promise<string> {
  const token = nanoid(48);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);
  
  try {
    // Store only the SHA-256 hash in the DB so a DB leak cannot be used to
    // hijack sessions. The raw token lives exclusively in the user's cookie.
    await prisma.session.create({ data: { id: nanoid(24), userId, token: tokenHash, expiresAt } });
    await setSessionCookie(token, expiresAt);
    await setRoleCookie(role, expiresAt);
    return token;
  } catch (error) {
    console.error(`[AUTH] createSession: Failed to create session for user ${userId}:`, error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// getCurrentUser — reads session cookie, validates against DB
// ─────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;

  // Hash the cookie token before DB lookup — only hashes are stored in the DB.
  const session = await prisma.session.findUnique({
    where: { token: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          profileImage: true,
          timezone: true,
          emailVerified: true,
          hasPaid: true,
          planType: true,
          courseFor: true,
          studentName: true,
          parentEmail: true,
          parentEmailVerified: true,
          sendWeeklyReports: true,
          studentProfile: { select: { id: true } },
          learnerProfiles: {
            select: { id: true, displayName: true, isDefault: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch((err) => {
      console.error(`[AUTH] Failed to delete expired session:`, err);
    });
    return null;
  }

  const user = session.user;
  
  if (!isRole(user.role)) {
    console.error(`[AUTH] Invalid role "${user.role}" for user ${user.id}`);
    return null;
  }
  
  if (!user.isActive) return null;

  // Resolve active profile from cookie, validated against this user's profiles.
  const profileCookieId = cookieStore.get(PROFILE_COOKIE)?.value ?? null;
  let activeProfile: { id: string; displayName: string } | null = null;

  if (profileCookieId) {
    activeProfile = user.learnerProfiles.find((p) => p.id === profileCookieId) ?? null;
  }

  // Fallback to default profile (or first profile if no default is set).
  if (!activeProfile) {
    activeProfile =
      user.learnerProfiles.find((p) => p.isDefault) ??
      user.learnerProfiles[0] ??
      null;
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role as Role,
    isActive: user.isActive,
    profileImage: user.profileImage,
    timezone: user.timezone,
    studentProfileId: user.studentProfile?.id ?? null,
    emailVerified: user.emailVerified,
    hasPaid: user.hasPaid,
    planType: user.planType,
    activeProfileId: activeProfile?.id ?? null,
    activeProfileName: activeProfile?.displayName ?? null,
    courseFor: user.courseFor,
    studentName: user.studentName,
    parentEmail: user.parentEmail,
    parentEmailVerified: user.parentEmailVerified,
    sendWeeklyReports: user.sendWeeklyReports,
  };
}

// ─────────────────────────────────────────────────────────────
// Route guards
// ─────────────────────────────────────────────────────────────

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    // Build a return URL from the middleware-forwarded pathname header so the
    // user lands back where they came from after signing in.
    let loginUrl = "/login";
    try {
      const hdrs = await headers();
      const pathname = hdrs.get("x-pathname") ?? "";
      const search = hdrs.get("x-search") ?? "";
      // Only forward safe internal paths — skip auth/api routes to avoid loops.
      if (
        pathname &&
        pathname !== "/login" &&
        !pathname.startsWith("/api/") &&
        !pathname.startsWith("/_next/")
      ) {
        const returnPath = pathname + search;
        loginUrl = `/login?redirect=${encodeURIComponent(returnPath)}`;
      }
    } catch {
      // headers() unavailable in some edge contexts — fall back to plain /login
    }
    redirect(loginUrl);
  }

  // In production, unverified users must complete email verification before
  // accessing any protected route. Dev mode skips this so local dev still works.
  if (process.env.NODE_ENV === "production" && !user.emailVerified) {
    redirect("/verify-email-pending");
  }

  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    const home = user.role === ROLES.PLATFORM_ADMIN ? "/admin/dashboard" : "/student/dashboard";
    redirect(home);
  }
  return user;
}

export async function requirePlatformAdmin(): Promise<SessionUser> {
  return requireRole(ROLES.PLATFORM_ADMIN);
}

// Keep backward-compat alias
export { requirePlatformAdmin as requireAdmin };

export async function requireStudent(): Promise<SessionUser> {
  return requireRole(ROLES.STUDENT);
}

// ─────────────────────────────────────────────────────────────
// Login — email-based authentication
// ─────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; role?: Role; hasPurchase?: boolean; isPastDue?: boolean; userId?: string }> {
  const startTime = Date.now();
  const lowerEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: lowerEmail },
  });

  if (!user) {
    // Run a dummy bcrypt comparison so "user not found" takes the same wall-clock
    // time as "wrong password", preventing timing-based user enumeration.
    await bcrypt.compare(password, "$2a$12$dummyhashfortimingequalityXXXXXXXXXXXXXXX");
    return { success: false, error: "Invalid credentials" };
  }

  if (!user.isActive) return { success: false, error: "Account is deactivated" };

  if (!user.passwordHash) {
    await bcrypt.compare(password, "$2a$12$dummyhashfortimingequalityXXXXXXXXXXXXXXX");
    return { success: false, error: "Please set up your password first" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { success: false, error: "Invalid email or password" };

  const isDevelopment = process.env.NODE_ENV !== "production";
  if (!isDevelopment && !user.emailVerified) {
    return { success: false, error: "Please verify your email before signing in" };
  }

  try {
    await createSession(user.id, user.role);
  } catch (error) {
    console.error(`[AUTH] login: Failed to create session for ${user.id}:`, error);
    return { success: false, error: "Failed to create session. Please try again." };
  }

  // Run lastLoginAt stamp and purchase check in parallel — they are independent.
  // NOTE: hasPaid alone is insufficient — monthly subscribers have hasPaid=false
  // (only lifetime purchases set it), so the DB check is still required for them.
  // However, hasPaid=true is always authoritative: admin grants, promo-code free
  // access, and any other path that sets it directly must also be honoured here.
  const [, purchaseInfo] = await Promise.all([
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
    userHasPurchases(user.id),
  ]);
  const hasPurchase = user.hasPaid || purchaseInfo.hasPurchase;
  // Lifetime buyers (hasPaid=true) are never "past due" — only monthly subs can be.
  const isPastDue   = !user.hasPaid && purchaseInfo.isPastDue;

  const elapsed = Date.now() - startTime;
  if (elapsed > 3000) console.warn(`[AUTH] login: Slow login for ${lowerEmail} [${elapsed}ms]`);

  return { success: true, role: user.role as Role, hasPurchase, isPastDue, userId: user.id };
}

// ─────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.delete({ where: { token: hashToken(token) } }).catch((err) => {
      console.error(`[AUTH] logout: Failed to delete session:`, err);
    });
  }

  await clearSessionCookie();
}

// ─────────────────────────────────────────────────────────────
// Purchase checks
// ─────────────────────────────────────────────────────────────

export async function userHasPurchases(userId: string): Promise<{ hasPurchase: boolean; isPastDue: boolean }> {
  const [purchase, subscription] = await Promise.all([
    prisma.purchase.findFirst({ where: { userId, status: "succeeded" }, select: { id: true } }),
    prisma.subscription.findFirst({
      where: { userId, status: { in: ["active", "trialing", "past_due"] } },
      select: { id: true, status: true },
    }),
  ]);
  const hasPurchase = !!(purchase || subscription);
  const isPastDue   = !purchase && subscription?.status === "past_due";
  return { hasPurchase, isPastDue };
}

// ─────────────────────────────────────────────────────────────
// Email verification
// ─────────────────────────────────────────────────────────────

export async function verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
  // The DB stores the hash; hash the incoming token before lookup.
  const user = await prisma.user.findFirst({ where: { verificationToken: hashToken(token) } });

  if (!user) return { success: false, error: "Invalid or expired verification link" };

  if (user.verificationExpires && user.verificationExpires < new Date()) {
    return { success: false, error: "This verification link has expired. Please request a new one." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null, verificationExpires: null },
  });

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Password reset
// ─────────────────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Don't reveal if email exists — return success to prevent email enumeration.
    return { success: true };
  }

  console.log(`[PASSWORD_RESET] Processing reset request`);

  const resetToken = nanoid(32);
  const resetTokenHash = hashToken(resetToken);
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetTokenHash, // Store hash — raw token only in email
      passwordResetExpiry: resetExpiry,
    },
  });

  // Send password reset email
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "TheMuslimMan <noreply@themuslimman.com>",
      to: user.email,
      subject: "Reset Your Password - Seerah LMS",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #f4c542; margin: 0; font-size: 24px;">Password Reset Request</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e5e5; border-top: none;">
              <p style="font-size: 16px; margin: 0 0 20px 0;">Hello ${user.fullName ?? "there"},</p>
              
              <p style="font-size: 16px; margin: 0 0 20px 0;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #f4c542; color: #1a1a1a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin: 30px 0 0 0;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 12px; color: #999; word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
                ${resetUrl}
              </p>
              
              <p style="font-size: 14px; color: #e74c3c; background: #fee; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <strong>⚠️ Security Notice:</strong> This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none;">
              <p style="font-size: 13px; color: #999; margin: 0;">
                © ${new Date().getFullYear()} Seerah LMS · TheMuslimMan
              </p>
            </div>
          </body>
        </html>
      `,
    });
    console.log(`[PASSWORD_RESET] Email sent successfully:`, result);
  } catch (emailError) {
    console.error("[PASSWORD_RESET] Failed to send password reset email:", emailError);
    // Return failure so the UI can inform the user rather than saying "email sent"
    // when it wasn't. The token in the DB is harmless to leave (it expires in 1 h).
    return { success: false, error: "Failed to send reset email. Please try again." };
  }

  return { success: true };
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) return { success: false, error: "Password must be at least 8 characters" };

  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: tokenHash, passwordResetExpiry: { gt: new Date() } },
  });

  if (!user) return { success: false, error: "Invalid or expired reset link" };

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update password and revoke ALL existing sessions so any attacker
  // who had a stolen session is kicked out immediately.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null, emailVerified: true },
    }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Change password (for logged-in users)
// ─────────────────────────────────────────────────────────────

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (!dbUser || !dbUser.passwordHash) return { success: false, error: "User not found" };

  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!valid) return { success: false, error: "Current password is incorrect" };

  if (newPassword.length < 8) return { success: false, error: "New password must be at least 8 characters" };

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update password and revoke ALL other sessions so any stolen session
  // is immediately invalidated (same behaviour as resetPassword).
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);

  return { success: true };
}
