import Link from "next/link";
import { Lock, CheckCircle2, ShieldCheck } from "lucide-react";

export function Footer() {
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
              Structured Seerah learning for serious Muslim learners.
            </p>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-text-muted" />
              <span>Early Supporter Pricing</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-text text-sm mb-4">Product</h3>
            <ul className="space-y-2.5">
              {[
                { label: "What's Inside", href: "/#preview" },
                { label: "Pricing", href: "/#pricing" },
                { label: "About", href: "/about" },
                { label: "Methodology", href: "/methodology" },
                { label: "Get Started", href: "/signup-checkout?plan=complete" },
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
            <h3 className="font-semibold text-text text-sm mb-4">Support</h3>
            <ul className="space-y-2.5">
              {[
                { label: "FAQ", href: "/#faq" },
                { label: "Contact Us", href: "/contact" },
                { label: "Help Center", href: "/contact" },
                { label: "Refund Policy", href: "/refund" },
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
            <h3 className="font-semibold text-text text-sm mb-4">Account</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Log In", href: "/login" },
                { label: "Create Account", href: "/signup-checkout?plan=complete" },
                { label: "Member Dashboard", href: "/seerah" },
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
            <span>Secure Checkout</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>Instant Access</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>7-Day Clarity Guarantee</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>Lifetime Access</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
          <p className="text-sm text-text-muted">
            © {currentYear} TheMuslimMan. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/refund"
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              Refund Policy
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
