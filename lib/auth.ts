"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "./db";
import type { SessionUser } from "./session";
import { ROLES, type Role, isRole } from "./roles";

const COOKIE_NAME = "seerah_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const BCRYPT_ROUNDS = 12;

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

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

async function createSession(userId: string): Promise<string> {
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);
  await prisma.session.create({ data: { userId, token, expiresAt } });
  await setSessionCookie(token, expiresAt);
  return token;
}

// ─────────────────────────────────────────────────────────────
// getCurrentUser — reads session cookie, validates against DB
// ─────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          student: { select: { id: true } },
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  const { user } = session;
  if (!isRole(user.role)) return null;
  if (!user.isActive) return null;

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    role: user.role as Role,
    isActive: user.isActive,
    profileImage: user.profileImage,
    timezone: user.timezone,
    studentProfileId: user.student?.id ?? null,
    emailVerified: user.emailVerified,
  };
}

// ─────────────────────────────────────────────────────────────
// Route guards
// ─────────────────────────────────────────────────────────────

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    // Redirect to role-specific home
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
// Login — username only (no email login)
// ─────────────────────────────────────────────────────────────

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; role?: Role }> {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    include: { student: true },
  });

  if (!user) {
    return { success: false, error: "Invalid username or password" };
  }

  if (!user.isActive) {
    return { success: false, error: "Account is deactivated" };
  }

  if (!user.passwordHash) {
    return { success: false, error: "Please set up your password first" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid username or password" };
  }

  // In production, require email verification. In development, skip it.
  const isDevelopment = process.env.NODE_ENV !== "production";
  if (!isDevelopment && !user.emailVerified) {
    return { success: false, error: "Please verify your email before signing in" };
  }

  await createSession(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { success: true, role: user.role as Role };
}

// ─────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.delete({ where: { token } }).catch(() => {});
  }

  await clearSessionCookie();
}

// ─────────────────────────────────────────────────────────────
// Email verification
// ─────────────────────────────────────────────────────────────

export async function verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) {
    return { success: false, error: "Invalid or expired verification link" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
    },
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
    // Don't reveal if email exists
    return { success: true };
  }

  const resetToken = nanoid(32);
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
    },
  });

  // Send password reset email
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Seerah LMS <noreply@themuslimman.com>",
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
              <p style="font-size: 16px; margin: 0 0 20px 0;">Hello ${user.fullName},</p>
              
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
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
    // Don't fail the request if email fails
  }

  return { success: true };
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return { success: false, error: "Invalid or expired reset link" };
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

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

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || !dbUser.passwordHash) {
    return { success: false, error: "User not found" };
  }

  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!valid) {
    return { success: false, error: "Current password is incorrect" };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters" };
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { success: true };
}
