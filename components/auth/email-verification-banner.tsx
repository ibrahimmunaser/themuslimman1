"use client";

import { useState } from "react";
import { Mail, X } from "lucide-react";

interface EmailVerificationBannerProps {
  email: string;
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-gold/20 to-amber-600/20 border-b border-gold/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-text">
                <span className="font-semibold">Verify your email to unlock all features.</span>{" "}
                <span className="text-text-secondary">
                  We sent a verification link to <span className="font-medium text-gold">{email}</span>
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-text-muted hover:text-text transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
