import Link from "next/link";
import { Check } from "lucide-react";

export const metadata = { title: "Email Verified | Seerah LMS" };

export default function ParentEmailVerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-surface border border-border rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-text mb-3">
            Email Verified Successfully!
          </h1>

          <p className="text-text-secondary mb-6">
            Your email has been verified and is now locked. You will receive progress reports about the student's Seerah learning journey.
          </p>

          <div className="bg-surface-raised rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-text-secondary mb-2">
              <strong className="text-text">What's next?</strong>
            </p>
            <ul className="text-sm text-text-secondary space-y-2">
              <li>✅ Your email is locked and secure</li>
              <li>📧 You can receive progress reports</li>
              <li>🔒 Only you can approve email removal</li>
            </ul>
          </div>

          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors"
          >
            Return to Home
          </Link>
        </div>

        <p className="text-text-muted text-sm mt-6">
          © {new Date().getFullYear()} Seerah LMS · TheMuslimMan
        </p>
      </div>
    </div>
  );
}
