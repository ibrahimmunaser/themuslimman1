"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CourseLang } from "@/lib/course-lang";
import { siteT } from "@/lib/site-copy";

interface NavLinksProps {
  isLoggedIn: boolean;
  lang: CourseLang;
}

export function NavLinks({ isLoggedIn, lang }: NavLinksProps) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: siteT(lang, "navHome") },
    // Course dashboard is open to everyone (free part unlocked, rest locked).
    { href: "/seerah", label: siteT(lang, isLoggedIn ? "navMyCourse" : "navCourse") },
    { href: "/pricing", label: siteT(lang, "navPricing") },
    { href: "/contact", label: siteT(lang, "navHelp") },
  ];

  return (
    <>
      {links.map((link) => {
        const isCurrent = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isCurrent ? "page" : undefined}
            className={`text-sm transition-colors ${
              isCurrent
                ? "text-text"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
