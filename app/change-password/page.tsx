import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChangePasswordForm } from "./change-password-form";
import { redirect } from "next/navigation";
import { roleHome } from "@/lib/roles";
import type { Role } from "@/lib/roles";

export const metadata = { title: "Set Your Password", robots: { index: false, follow: false } };
export const dynamic  = "force-dynamic";

export default async function ChangePasswordPage() {
  const user = await requireAuth();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, emailVerified: true },
  });

  // Users who already have a password should use account settings / the
  // authenticated changePassword flow — this page is for first-time setup
  // (guest checkout set-password links) only.
  const needsSetup = !dbUser?.passwordHash;
  if (!needsSetup) {
    redirect(roleHome(user.role as Role));
  }

  // Guests who only typed an email into checkout must not set a password
  // without inbox proof. Post-purchase setup uses /api/auth/set-password
  // with a setup: token (which also marks emailVerified).
  if (!dbUser?.emailVerified) {
    redirect("/verify-email-pending");
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center p-4">
      <ChangePasswordForm userName={user.fullName} requireCurrentPassword={false} />
    </div>
  );
}
