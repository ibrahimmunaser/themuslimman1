import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // If already signed in, redirect to /seerah which acts as the single gatekeeper
  // (shows verification wall, package selection, or the course based on account state).
  const user = await getCurrentUser();

  if (user) {
    if (user.role !== "student") {
      const { roleHome } = await import("@/lib/roles");
      redirect(roleHome(user.role));
    }
    redirect("/seerah");
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
