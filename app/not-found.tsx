import Link from "next/link";
import { Home, HelpCircle, DollarSign } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 mb-8 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logoicon.png"
            alt="TheMuslimMan"
            className="h-10 w-auto"
          />
        </Link>

        {/* 404 Message */}
        <div className="mb-8">
          <h1 className="text-8xl sm:text-9xl font-bold text-gold/20 mb-4">404</h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
            Page Not Found
          </h2>
          <p className="text-text-secondary max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link href="/" className={buttonClass("primary", "lg")}>
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link href="/pricing" className={buttonClass("outline", "lg")}>
            <DollarSign className="w-4 h-4" />
            View Pricing
          </Link>
          <Link href="/contact" className={buttonClass("outline", "lg")}>
            <HelpCircle className="w-4 h-4" />
            Get Help
          </Link>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-text-muted mb-3">Looking for something else?</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/seerah" className="text-text-secondary hover:text-gold transition-colors">
              Dashboard
            </Link>
            <span className="text-border">•</span>
            <Link href="/login" className="text-text-secondary hover:text-gold transition-colors">
              Sign In
            </Link>
            <span className="text-border">•</span>
            <Link href="/checkout?plan=individual-lifetime" className="text-text-secondary hover:text-gold transition-colors">
              Get Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
