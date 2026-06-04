import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { NavbarUserMenu } from "./navbar-user-menu";
import { NavbarMobileMenu } from "./navbar-mobile-menu";
import { NavLinks } from "./nav-links";

export async function Navbar() {
  let user = null;
  let firstName = null;
  
  try {
    user = await getCurrentUser();
    firstName = user ? user.fullName.split(" ")[0] : null;
  } catch (error) {
    if ((error as { digest?: string })?.digest !== "DYNAMIC_SERVER_USAGE") {
      console.error("Navbar: Failed to get current user:", error);
    }
  }

  return (
    <header className="sticky top-0 z-[90] w-full bg-ink">
      <div className="border-b border-white/5">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group shrink-0">
            <Image
              src="/images/logoicon.png"
              alt="TheMuslimMan"
              width={56}
              height={56}
              className="h-11 sm:h-14 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLinks isLoggedIn={!!user} />
            <NavbarUserMenu user={user} firstName={firstName} />
          </div>

          {/* Mobile menu */}
          <NavbarMobileMenu user={user} firstName={firstName} />
        </nav>
      </div>
    </header>
  );
}
