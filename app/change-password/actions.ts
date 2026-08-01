"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { roleHome } from "@/lib/roles";
import type { Role } from "@/lib/roles";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { hashToken } from "@/lib/hash-token";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookies";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Sets a new password.
 * - First-time setup (passwordHash is null): no current password required.
 * - Existing password: current password required; other sessions revoked.
 */
export async function changePasswordAndRedirect(
  newPassword: string,
  currentPassword?: string,
): Promise<{ error: string }> {
  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const rl = await checkRateLimit(`change-password-page:${user.id}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return { error: "Too many attempts. Please try again later." };
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, emailVerified: true },
    });
    if (!dbUser) {
      return { error: "Not authenticated" };
    }

    if (dbUser.passwordHash) {
      if (!currentPassword) {
        return { error: "Current password is required." };
      }
      const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
      if (!valid) {
        return { error: "Current password is incorrect." };
      }
    } else if (!dbUser.emailVerified) {
      // First-time set without inbox proof — use the emailed setup: link instead.
      return { error: "Please confirm your email via the link we sent before setting a password." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const cookieStore = await cookies();
    const currentRawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const currentTokenHash = currentRawToken ? hashToken(currentRawToken) : null;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      }),
      prisma.session.deleteMany({
        where: {
          userId: user.id,
          ...(currentTokenHash ? { NOT: { token: currentTokenHash } } : {}),
        },
      }),
    ]);
  } catch (error) {
    console.error("Password update error:", error);
    return { error: "Failed to change password. Please try again." };
  }

  const updatedUser = await getCurrentUser();
  redirect(updatedUser ? roleHome(updatedUser.role as Role) : "/login");
}
