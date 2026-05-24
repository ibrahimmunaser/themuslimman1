"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GiftClaimButtonProps {
  token: string;
  userName: string;
  alreadyHasPaid: boolean;
}

export default function GiftClaimButton({ token, userName, alreadyHasPaid }: GiftClaimButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  if (alreadyHasPaid) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-green-400 font-medium text-sm">You already have Complete Seerah access!</p>
          <p className="text-text-muted text-xs mt-1">This gift has been registered to your account.</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.push("/seerah")}
          className="w-full justify-center"
        >
          Go to Course Dashboard
        </Button>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-green-400 font-semibold">Access Claimed Successfully!</p>
          <p className="text-text-muted text-xs mt-1">Welcome, {userName}. Your lifetime access is now active.</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.push("/seerah")}
          className="w-full justify-center gap-2"
        >
          <Gift className="w-4 h-4" />
          Start Learning
        </Button>
      </div>
    );
  }

  const handleClaim = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gift/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to claim gift. Please try again.");
        return;
      }

      setClaimed(true);
      // Full page reload so hasPaid state is fresh from server
      setTimeout(() => {
        window.location.href = "/seerah";
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary text-center">
        Signed in as <span className="text-text font-medium">{userName}</span>
      </p>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        onClick={handleClaim}
        loading={loading}
        disabled={loading}
        className="w-full justify-center gap-2"
      >
        <Gift className="w-4 h-4" />
        Claim Your Gift
      </Button>

      <p className="text-xs text-text-muted text-center">
        This will activate lifetime access on your account. This link can only be used once.
      </p>
    </div>
  );
}
