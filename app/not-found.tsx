import Link from "next/link";
import { ArrowLeft, Home, HelpCircle, DollarSign } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 mb-8 group">
          <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center group-hover:border-gold/60 transition-colors">
            <span className="text-gold font-bold">T</span>
          </div>
          <span className="text-text font-semibold text-lg tracking-wide">
            TheMuslimMan
          </span>
        </Link>

        {/* 404 Message */}
        <div className="mb-8">
          <h1 className="text-8xl sm:text-9xl font-bold text-gold/20 mb-4">404</h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
            Page Not Found
          </h2>
          <p className="text-text-secondary max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link
            href="/"
            className={buttonClass("primary", "lg")}
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/pricing"
            className={buttonClass("outline", "lg")}
          >
            <DollarSign className="w-4 h-4" />
            View Pricing
          </Link>
          <Link
            href="/help"
            className={buttonClass("outline", "lg")}
          >
            <HelpCircle className="w-4 h-4" />
            Get Help
          </Link>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-text-muted mb-3">Looking for something else?</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/my-courses" className="text-text-secondary hover:text-gold transition-colors">
              My Courses
            </Link>
            <span className="text-border">•</span>
            <Link href="/learn" className="text-text-secondary hover:text-gold transition-colors">
              Dashboard
            </Link>
            <span className="text-border">•</span>
            <Link href="/login" className="text-text-secondary hover:text-gold transition-colors">
              Sign In
            </Link>
            <span className="text-border">•</span>
            <Link href="/signup" className="text-text-secondary hover:text-gold transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
