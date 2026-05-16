import Link from "next/link";
import { Check } from "lucide-react";

export const metadata = { title: "Email Removed | Complete Seerah" };

export default function ParentEmailRemovedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-surface border border-border rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-text mb-3">
            Email Removed Successfully
          </h1>

          <p className="text-text-secondary mb-6">
            Your email has been removed from the student's progress reports. You will no longer receive progress updates.
          </p>

          <div className="bg-surface-raised rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-text-secondary">
              The student can add a new parent email anytime from their Settings page if needed.
            </p>
          </div>

          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors"
          >
            Return to Home
          </Link>
        </div>

        <p className="text-text-muted text-sm mt-6">
          © {new Date().getFullYear()} Complete Seerah · TheMuslimMan
        </p>
      </div>
    </div>
  );
}
