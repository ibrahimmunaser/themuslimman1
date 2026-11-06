import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { getCachedCurrentUser } from "@/lib/auth-cache";
import { hasActiveCourseAccess } from "@/lib/access";
import { NavbarUserMenu } from "./navbar-user-menu";
import { NavbarMobileMenu } from "./navbar-mobile-menu";
import { NavLinks } from "./nav-links";
import { LangToggle } from "@/components/part/lang-toggle";
import { getPreviewLangFromCookies } from "@/lib/part1-preview-data";
import type { CourseLang } from "@/lib/course-lang";

async function resolveNavUser() {
  let user = null;
  let firstName: string | null = null;

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

  return { user, firstName, hasPaid };
}

// The session + course-access lookups above hit the DB and were adding ~2s to
// TTFB on every page that renders <Navbar> — including purely static pages
// like /terms, /privacy, /refund, and /about, which Ahrefs flagged under
// "Slow server response for AI crawlers" / "Slow page". Suspending just this
// auth-dependent slice lets the static shell (logo, page content) flush
// immediately; the personalized nav streams in right after. For anonymous
// visitors (the common case, including crawlers) the fallback below renders
// byte-for-byte the same guest nav, so there's no flicker — only logged-in
// users see a brief swap from guest nav to their account menu.
async function NavbarDesktopAuth({ lang }: { lang: CourseLang }) {
  const { user, firstName, hasPaid } = await resolveNavUser();
  return (
    <>
      <NavLinks isLoggedIn={!!user} lang={lang} />
      <LangToggle current={lang} nav />
      <NavbarUserMenu user={user} firstName={firstName} hasPaid={hasPaid} lang={lang} />
    </>
  );
}

async function NavbarMobileAuth({ lang }: { lang: CourseLang }) {
  const { user, firstName, hasPaid } = await resolveNavUser();
  return <NavbarMobileMenu user={user} firstName={firstName} hasPaid={hasPaid} lang={lang} />;
}

function NavbarDesktopFallback({ lang }: { lang: CourseLang }) {
  return (
    <>
      <NavLinks isLoggedIn={false} lang={lang} />
      <LangToggle current={lang} nav />
      <NavbarUserMenu user={null} firstName={null} hasPaid={false} lang={lang} />
    </>
  );
}

export async function Navbar() {
  const lang = await getPreviewLangFromCookies();

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
            <Suspense fallback={<NavbarDesktopFallback lang={lang} />}>
              <NavbarDesktopAuth lang={lang} />
            </Suspense>
          </div>

          {/* Mobile menu */}
          <Suspense fallback={<NavbarMobileMenu user={null} firstName={null} hasPaid={false} lang={lang} />}>
            <NavbarMobileAuth lang={lang} />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
