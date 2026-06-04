import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // If already signed in, skip the form and send them where they belong.
  const user = await getCurrentUser();

  if (user) {
    if (user.role !== "student") {
      // Admin / teacher → their own home
      const { roleHome } = await import("@/lib/roles");
      redirect(roleHome(user.role));
    }

    if (!user.hasPaid) {
      redirect("/pricing");
    }

    // Check if family plan to decide between profiles picker vs course
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { planType: true },
    });

    if (userData?.planType === "family") {
      redirect("/profiles");
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
