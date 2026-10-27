"use client";

import Link from "next/link";
import { Lock, CheckCircle2, ShieldCheck } from "lucide-react";
import { useSiteLang } from "@/components/site-lang";
import { siteT } from "@/lib/site-copy";

export function Footer() {
  const lang = useSiteLang();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logoicon.png"
                alt="TheMuslimMan"
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-text-muted leading-relaxed mb-4">
              {siteT(lang, "footBlurb")}
            </p>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-text-muted" />
              <span>{siteT(lang, "footEarly")}</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-text text-sm mb-4">{siteT(lang, "footProduct")}</h3>
            <ul className="space-y-2.5">
              {[
                { label: siteT(lang, "footInside"), href: "/#preview" },
                { label: siteT(lang, "navPricing"), href: "/#pricing" },
                { label: siteT(lang, "footAbout"), href: "/about" },
                { label: siteT(lang, "footMethod"), href: "/methodology" },
                { label: siteT(lang, "navGetStarted"), href: "/checkout" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted hover:text-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-text text-sm mb-4">{siteT(lang, "footSupport")}</h3>
            <ul className="space-y-2.5">
              {[
                { label: siteT(lang, "footFaq"), href: "/#faq" },
                { label: siteT(lang, "footContact"), href: "/contact" },
                { label: siteT(lang, "footHelpCenter"), href: "/contact" },
                { label: siteT(lang, "footRefund"), href: "/refund" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted hover:text-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold text-text text-sm mb-4">{siteT(lang, "footAccount")}</h3>
            <ul className="space-y-2.5">
              {[
                { label: siteT(lang, "navLogIn"), href: "/login" },
                { label: siteT(lang, "footCreate"), href: "/checkout" },
                { label: siteT(lang, "footDashboard"), href: "/seerah" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted hover:text-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 py-6 border-t border-border mb-6">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Lock className="w-3.5 h-3.5" />
            <span>{siteT(lang, "footSecure")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>{siteT(lang, "footInstant")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>{siteT(lang, "footGuarantee")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>{siteT(lang, "footLifetime")}</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
          <p className="text-sm text-text-muted">
            © {currentYear} TheMuslimMan. {siteT(lang, "footRights")}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              {siteT(lang, "footPrivacy")}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              {siteT(lang, "footTerms")}
            </Link>
            <Link
              href="/refund"
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              {siteT(lang, "footRefund")}
            </Link>
            <a
              href="https://themuslimman.com"
              className="text-sm text-text-muted hover:text-text transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              themuslimman.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
