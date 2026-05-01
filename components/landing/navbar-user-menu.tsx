import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { buttonClass } from "@/components/ui/button";
import { NavbarUserButton } from "./navbar-user-button";

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

  // Logged in - show user menu with dropdown
  const firstName = user.fullName.split(" ")[0];

  return (
    <>
      <Link href="/learn" className="text-sm text-text-secondary hover:text-text transition-colors">
        My Learning
      </Link>
      <NavbarUserButton firstName={firstName} />
    </>
  );
}
