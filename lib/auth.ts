"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "./db";
import type { SessionUser } from "./session";
import { ROLES, type Role, isRole } from "./roles";

const COOKIE_NAME = "seerah_session";
const ROLE_COOKIE  = "seerah_role"; // readable by middleware (not httpOnly)
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

async function setRoleCookie(role: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(ROLE_COOKIE, role, {
    httpOnly: false, // must be readable by middleware on the edge
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
}

async function createSession(userId: string, role: string): Promise<string> {
  console.log(`[AUTH] createSession: Creating session for user ${userId}, role: ${role}`);
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);
  
  try {
    await prisma.session.create({ data: { userId, token, expiresAt } });
    await setSessionCookie(token, expiresAt);
    await setRoleCookie(role, expiresAt);
    console.log(`[AUTH] createSession: Session created successfully for user ${userId}, token ${token.substring(0, 8)}..., expires ${expiresAt.toISOString()}`);
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
  const startTime = Date.now();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) {
    console.log(`[AUTH] getCurrentUser: No session token found`);
    return null;
  }

  console.log(`[AUTH] getCurrentUser: Fetching session for token ${token.substring(0, 8)}...`);

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

  if (!session) {
    console.log(`[AUTH] getCurrentUser: No session found for token ${token.substring(0, 8)}...`);
    return null;
  }

  if (session.expiresAt < new Date()) {
    console.log(`[AUTH] getCurrentUser: Session expired for user ${session.user.email}, expires at ${session.expiresAt.toISOString()}`);
    await prisma.session.delete({ where: { id: session.id } }).catch((err) => {
      console.error(`[AUTH] getCurrentUser: Failed to delete expired session:`, err);
    });
    return null;
  }

  const { user } = session;
  
  if (!isRole(user.role)) {
    console.error(`[AUTH] getCurrentUser: Invalid role "${user.role}" for user ${user.email}`);
    return null;
  }
  
  if (!user.isActive) {
    console.log(`[AUTH] getCurrentUser: User ${user.email} is inactive`);
    return null;
  }

  const elapsed = Date.now() - startTime;
  console.log(`[AUTH] getCurrentUser: Success for ${user.email} (role: ${user.role}, id: ${user.id}) [${elapsed}ms]`);

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role as Role,
    isActive: user.isActive,
    profileImage: user.profileImage,
    timezone: user.timezone,
    studentProfileId: user.student?.id ?? null,
    emailVerified: user.emailVerified,
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
  console.log(`[AUTH] requireAuth: Checking authentication...`);
  const user = await getCurrentUser();
  if (!user) {
    console.log(`[AUTH] requireAuth: No authenticated user, redirecting to /login`);
    redirect("/login");
  }
  console.log(`[AUTH] requireAuth: Authenticated as ${user.email} (role: ${user.role})`);
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  console.log(`[AUTH] requireRole: Checking for roles ${roles.join(", ")}`);
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    const home = user.role === ROLES.PLATFORM_ADMIN ? "/admin/dashboard" : "/student/dashboard";
    console.log(`[AUTH] requireRole: User ${user.email} has role ${user.role}, not in [${roles.join(", ")}]. Redirecting to ${home}`);
    redirect(home);
  }
  console.log(`[AUTH] requireRole: User ${user.email} authorized with role ${user.role}`);
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
): Promise<{ success: boolean; error?: string; role?: Role; hasPurchase?: boolean }> {
  const startTime = Date.now();
  const lowerEmail = email.toLowerCase();
  console.log(`[AUTH] login: Attempting login for email ${lowerEmail}`);
  
  const user = await prisma.user.findUnique({
    where: { email: lowerEmail },
    include: { student: true },
  });

  if (!user) {
    console.log(`[AUTH] login: User not found for email ${lowerEmail}`);
    return { success: false, error: "Invalid credentials" };
  }

  console.log(`[AUTH] login: User found: ${user.email} (id: ${user.id}, role: ${user.role}, active: ${user.isActive}, emailVerified: ${user.emailVerified})`);

  if (!user.isActive) {
    console.log(`[AUTH] login: Account deactivated for ${user.email}`);
    return { success: false, error: "Account is deactivated" };
  }

  if (!user.passwordHash) {
    console.log(`[AUTH] login: No password hash for ${user.email}`);
    return { success: false, error: "Please set up your password first" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    console.log(`[AUTH] login: Invalid password for ${user.email}`);
    return { success: false, error: "Invalid email or password" };
  }

  // In production, require email verification. In development, skip it.
  const isDevelopment = process.env.NODE_ENV !== "production";
  if (!isDevelopment && !user.emailVerified) {
    console.log(`[AUTH] login: Email not verified for ${user.email} (production mode)`);
    return { success: false, error: "Please verify your email before signing in" };
  }

  console.log(`[AUTH] login: Password valid for ${user.email}, creating session...`);
  
  try {
    await createSession(user.id, user.role);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    console.log(`[AUTH] login: Last login updated for ${user.email}`);
  } catch (error) {
    console.error(`[AUTH] login: Failed to create session or update last login for ${user.email}:`, error);
    return { success: false, error: "Failed to create session. Please try again." };
  }

  // Check if user has any successful purchases
  const hasPurchase = await userHasPurchases(user.id);
  console.log(`[AUTH] login: User ${user.email} has purchase: ${hasPurchase}`);

  const elapsed = Date.now() - startTime;
  console.log(`[AUTH] login: SUCCESS for ${user.email} (role: ${user.role}) [${elapsed}ms]`);

  return { success: true, role: user.role as Role, hasPurchase };
}

// ─────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    console.log(`[AUTH] logout: Deleting session for token ${token.substring(0, 8)}...`);
    await prisma.session.delete({ where: { token } }).catch((err) => {
      console.error(`[AUTH] logout: Failed to delete session:`, err);
    });
  } else {
    console.log(`[AUTH] logout: No session token to delete`);
  }

  await clearSessionCookie();
  console.log(`[AUTH] logout: Session cookies cleared`);
}

// ─────────────────────────────────────────────────────────────
// Purchase checks
// ─────────────────────────────────────────────────────────────

export async function userHasPurchases(userId: string): Promise<boolean> {
  console.log(`[AUTH] userHasPurchases: Checking access for user ${userId}`);
  const [purchase, subscription] = await Promise.all([
    prisma.purchase.findFirst({
      where: { userId, status: "succeeded" },
    }),
    prisma.subscription.findFirst({
      where: { userId, status: { in: ["active", "trialing"] } },
    }),
  ]);
  const hasAccess = !!(purchase || subscription);
  console.log(`[AUTH] userHasPurchases: User ${userId} has access: ${hasAccess}`);
  return hasAccess;
}

// ─────────────────────────────────────────────────────────────
// Email verification
// ─────────────────────────────────────────────────────────────

export async function verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[AUTH] verifyEmail: Verifying email with token ${token.substring(0, 8)}...`);
  
  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) {
    console.log(`[AUTH] verifyEmail: Invalid or expired token ${token.substring(0, 8)}...`);
    return { success: false, error: "Invalid or expired verification link" };
  }

  // Check token expiry
  if (user.verificationExpires && user.verificationExpires < new Date()) {
    console.log(`[AUTH] verifyEmail: Token expired for user ${user.email}`);
    return { success: false, error: "This verification link has expired. Please request a new one." };
  }

  console.log(`[AUTH] verifyEmail: Token valid for user ${user.email}, marking as verified...`);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationExpires: null,
    },
  });

  console.log(`[AUTH] verifyEmail: Email verified successfully for ${user.email}`);
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
    console.log(`[PASSWORD_RESET] Email not found: ${email}`);
    return { success: true };
  }
  
  console.log(`[PASSWORD_RESET] User found: ${user.email}, sending reset email...`);

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
    console.log(`[PASSWORD_RESET] Email sent successfully:`, result);
  } catch (emailError) {
    console.error("[PASSWORD_RESET] Failed to send password reset email:", emailError);
    // Don't fail the request if email fails
  }

  return { success: true };
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`[AUTH] resetPassword: Resetting password with token ${token.substring(0, 8)}...`);
  
  if (newPassword.length < 8) {
    console.log(`[AUTH] resetPassword: Password too short (${newPassword.length} characters)`);
    return { success: false, error: "Password must be at least 8 characters" };
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    console.log(`[AUTH] resetPassword: Invalid or expired token ${token.substring(0, 8)}...`);
    return { success: false, error: "Invalid or expired reset link" };
  }

  console.log(`[AUTH] resetPassword: Token valid for user ${user.email}, hashing new password...`);
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      emailVerified: true, // Verify email since they clicked the reset link
    },
  });

  console.log(`[AUTH] resetPassword: Password reset successfully for ${user.email}`);
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Change password (for logged-in users)
// ─────────────────────────────────────────────────────────────

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`[AUTH] changePassword: Attempting password change...`);
  
  const user = await getCurrentUser();
  if (!user) {
    console.log(`[AUTH] changePassword: Not authenticated`);
    return { success: false, error: "Not authenticated" };
  }

  console.log(`[AUTH] changePassword: User ${user.email} requesting password change`);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || !dbUser.passwordHash) {
    console.error(`[AUTH] changePassword: User ${user.email} not found or has no password hash`);
    return { success: false, error: "User not found" };
  }

  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!valid) {
    console.log(`[AUTH] changePassword: Current password invalid for ${user.email}`);
    return { success: false, error: "Current password is incorrect" };
  }

  if (newPassword.length < 8) {
    console.log(`[AUTH] changePassword: New password too short (${newPassword.length} characters)`);
    return { success: false, error: "New password must be at least 8 characters" };
  }

  console.log(`[AUTH] changePassword: Current password valid, hashing new password...`);
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  console.log(`[AUTH] changePassword: Password changed successfully for ${user.email}`);
  return { success: true };
}
