import Link from "next/link";
import Image from "next/image";
import { getCachedCurrentUser } from "@/lib/auth-cache";
import { hasActiveCourseAccess } from "@/lib/access";
import { NavbarUserMenu } from "./navbar-user-menu";
import { NavbarMobileMenu } from "./navbar-mobile-menu";
import { NavLinks } from "./nav-links";

export async function Navbar() {
  let user = null;
  let firstName = null;
  
  try {
    user = await getCachedCurrentUser();
    firstName = user ? user.fullName.split(" ")[0] : null;
  } catch (error) {
    if ((error as { digest?: string })?.digest !== "DYNAMIC_SERVER_USAGE") {
      console.error("Navbar: Failed to get current user:", error);
    }
  }

  // Use full access check — hasPaid alone misses monthly subscribers
  let hasPaid = false;
  if (user?.id) {
    try {
      hasPaid = await hasActiveCourseAccess(user.id, (user as { hasPaid?: boolean }).hasPaid);
    } catch {
      // Fall back to the session flag if the DB query fails
      hasPaid = !!(user as { hasPaid?: boolean }).hasPaid;
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
              width={967}
              height={219}
              sizes="(max-width: 640px) 194px, 247px"
              className="h-11 sm:h-14 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLinks isLoggedIn={!!user} />
            <NavbarUserMenu user={user} firstName={firstName} hasPaid={hasPaid} />
          </div>

          {/* Mobile menu */}
          <NavbarMobileMenu user={user} firstName={firstName} hasPaid={hasPaid} />
        </nav>
      </div>
    </header>
  );
}
