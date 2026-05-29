"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinksProps {
  isLoggedIn: boolean;
}

export function NavLinks({ isLoggedIn }: NavLinksProps) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/contact", label: "Help" },
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
