import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { buttonClass } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

export async function NavbarUserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    // Not logged in - show Login button
    return (
      <>
        <Link href="/login" className="text-sm text-text-secondary hover:text-text transition-colors">
          Login
        </Link>
        <Link href="#pricing" className={buttonClass("primary", "sm")}>
          Get Started
        </Link>
      </>
    );
  }

  // Logged in - show user menu
  const firstName = user.fullName.split(" ")[0];

  return (
    <>
      <Link href="/learn" className="text-sm text-text-secondary hover:text-text transition-colors">
        My Learning
      </Link>
      <Link 
        href="/learn"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border hover:border-gold/30 transition-all"
      >
        <User className="w-4 h-4 text-gold" />
        <span className="text-sm text-text font-medium">Welcome, {firstName}</span>
      </Link>
    </>
  );
}
