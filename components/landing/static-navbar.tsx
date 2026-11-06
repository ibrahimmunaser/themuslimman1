import Link from "next/link";
import Image from "next/image";
import { NavbarUserMenu } from "./navbar-user-menu";
import { NavbarMobileMenu } from "./navbar-mobile-menu";
import { NavLinks } from "./nav-links";
import { LangToggle } from "@/components/part/lang-toggle";

// A Navbar variant with zero dynamic APIs (no cookies(), no DB lookups), for
// purely informational pages (Terms, Privacy, Refund, About) that don't need
// personalization. The full <Navbar> reads the session cookie and queries
// the DB for course access, which forces the whole route into dynamic SSR —
// on these rarely-visited pages that meant ~2s TTFB from serverless cold
// starts, which Ahrefs flagged as "Slow server response for AI crawlers" and
// "Slow page". This version always renders the logged-out nav so the page
// (and this component) can be fully static and served instantly from the
// CDN edge, with no function invocation at all.
export function StaticNavbar() {
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

          {/* Desktop nav — always the logged-out variant */}
          <div className="hidden md:flex items-center gap-6">
            <NavLinks isLoggedIn={false} lang="en" />
            <LangToggle current="en" nav />
            <NavbarUserMenu user={null} firstName={null} hasPaid={false} lang="en" />
          </div>

          {/* Mobile menu */}
          <NavbarMobileMenu user={null} firstName={null} hasPaid={false} lang="en" />
        </nav>
      </div>
    </header>
  );
}
