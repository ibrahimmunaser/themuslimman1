import { prisma } from "@/lib/db";
import { hashGiftToken } from "@/lib/gift";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Gift } from "lucide-react";
import GiftClaimButton from "./claim-button";

export const dynamic = "force-dynamic";

interface GiftClaimPageProps {
  params: Promise<{ token: string }>;
}

export default async function GiftClaimPage({ params }: GiftClaimPageProps) {
  const { token } = await params;

  // Look up the gift by token hash
  const tokenHash = hashGiftToken(token);
  const gift = await prisma.giftPurchase.findUnique({
    where: { claimTokenHash: tokenHash },
  });

  // ── Invalid / not found ──────────────────────────────────────────────────
  if (!gift || gift.status === "pending") {
    return (
      <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <span className="text-3xl">✕</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Invalid Gift Link</h1>
          <p className="text-text-secondary mb-6 text-sm">
            This gift link is invalid, has expired, or does not exist.
            If you believe this is an error, please contact support.
          </p>
          <Link
            href="/contact"
            className="inline-block text-sm text-gold hover:text-gold-light transition-colors"
          >
            Contact support →
          </Link>
        </div>
      </div>
    );
  }

  // ── Already claimed ──────────────────────────────────────────────────────
  if (gift.status === "claimed") {
    return (
      <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Gift Already Claimed</h1>
          <p className="text-text-secondary mb-6 text-sm">
            This gift has already been claimed and cannot be used again.
            If you were the intended recipient and did not claim it, please contact support.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full py-3 px-6 rounded-lg bg-gold text-ink font-semibold text-sm text-center hover:bg-gold/90 transition-colors"
            >
              Sign In to Your Account
            </Link>
            <Link
              href="/contact"
              className="inline-block text-sm text-text-muted hover:text-gold transition-colors"
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Expired ──────────────────────────────────────────────────────────────
  if (gift.status === "expired" || (gift.expiresAt && gift.expiresAt < new Date())) {
    return (
      <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <span className="text-3xl">⌛</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Gift Link Expired</h1>
          <p className="text-text-secondary mb-6 text-sm">
            This gift link has expired. Please contact the person who gifted you the course,
            or reach out to support.
          </p>
          <Link
            href="/contact"
            className="inline-block text-sm text-gold hover:text-gold-light transition-colors"
          >
            Contact support →
          </Link>
        </div>
      </div>
    );
  }

  // ── Valid gift (status = paid) ────────────────────────────────────────────
  const user = await getCurrentUser();

  // Look up hasPaid directly from DB (not on session type)
  let alreadyHasPaid = false;
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { hasPaid: true },
    });
    alreadyHasPaid = dbUser?.hasPaid ?? false;
  }

  const toName = gift.recipientName ?? null;
  const fromEmail = gift.purchaserEmail;
  const recipientEmail = gift.recipientEmail;
  const isFamily = (gift.planId ?? "complete") === "family";
  const planLabel = isFamily ? "Family Access to Complete Seerah" : "Complete Seerah";

  // If a user is signed in with the wrong email, show a clear mismatch error
  const isWrongUser = user && user.email.toLowerCase() !== recipientEmail.toLowerCase();

  return (
    <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">

        {/* Gift header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center mb-6">
            <Gift className="w-10 h-10 text-gold" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            You&apos;ve Been Gifted {planLabel}
          </h1>
          <p className="text-text-secondary">
            {fromEmail} has given you lifetime access to the full 100-part Seerah journey.
            {isFamily && " Your gift includes up to 5 learner profiles."}
          </p>
        </div>

        {/* Gift card */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6">

          {/* Personal message */}
          {gift.giftMessage && (
            <div className="p-4 rounded-xl bg-gold/5 border border-gold/20">
              <p className="text-xs text-gold font-semibold uppercase tracking-wider mb-2">
                A personal message
              </p>
              <p className="text-text italic text-sm leading-relaxed">&quot;{gift.giftMessage}&quot;</p>
              <p className="text-xs text-text-muted mt-2">— {fromEmail}</p>
            </div>
          )}

          {/* What's included */}
          <div>
            <p className="text-sm font-medium text-text mb-2">Your gift includes:</p>
            <ul className="text-sm text-text-secondary space-y-1.5">
              {(isFamily ? [
                "Up to 5 learner profiles — each with separate progress",
                "All 100 Seerah parts for every profile",
                "Video, audio, briefings, slides, infographics",
                "Quizzes, flashcards, and mind maps",
                "Lifetime access — no expiry, no subscriptions",
              ] : [
                "All 100 Seerah parts — the complete story of the Prophet ﷺ",
                "Video lessons, briefings, quizzes, flashcards, and more",
                "Guided progress tracking",
                "Lifetime access — no expiry, no subscriptions",
              ]).map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-gold mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Claim section */}
          <div className="pt-4 border-t border-border">
            {isWrongUser ? (
              /* Logged in, but wrong account */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <p className="text-red-400 font-medium text-sm mb-1">Wrong account</p>
                  <p className="text-text-secondary text-sm">
                    This gift was sent to{" "}
                    <span className="text-gold font-medium">{recipientEmail}</span>.
                    You&apos;re currently signed in as{" "}
                    <span className="text-text font-medium">{user!.email}</span>.
                  </p>
                </div>
                <p className="text-sm text-text-secondary text-center">
                  Please sign out and sign in with{" "}
                  <span className="text-gold font-medium">{recipientEmail}</span> to claim this gift.
                </p>
                <Link
                  href={`/api/auth/signout?redirect=/gift/claim/${encodeURIComponent(token)}`}
                  className="block w-full py-3.5 px-6 rounded-lg bg-gold text-ink font-semibold text-center text-base hover:bg-gold/90 transition-colors"
                >
                  Sign Out & Switch Account
                </Link>
              </div>
            ) : user ? (
              <GiftClaimButton token={token} userName={user.fullName} alreadyHasPaid={alreadyHasPaid} planLabel={planLabel} />
            ) : (
              /* Not logged in */
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-gold/5 border border-gold/20 text-center">
                  <p className="text-xs text-text-secondary">
                    This gift was sent to{" "}
                    <span className="text-gold font-medium">{recipientEmail}</span>.
                    Use that email to sign in or create an account.
                  </p>
                </div>
                <p className="text-sm text-text-secondary text-center">
                  {toName ? `Hi ${toName}! ` : ""}Sign in or create a free account to activate your gift.
                  No payment needed — the course has already been paid for.
                </p>
                <Link
                  href={`/login?redirect=${encodeURIComponent(`/gift/claim/${token}`)}&email=${encodeURIComponent(recipientEmail)}`}
                  className="block w-full py-3.5 px-6 rounded-lg bg-gold text-ink font-semibold text-center text-base hover:bg-gold/90 transition-colors"
                >
                  Sign In to Claim Your Gift
                </Link>
                <Link
                  href={`/signup?redirect=${encodeURIComponent(`/gift/claim/${token}`)}&email=${encodeURIComponent(recipientEmail)}`}
                  className="block w-full py-3.5 px-6 rounded-lg border border-gold/40 text-gold font-semibold text-center text-base hover:bg-gold/5 transition-colors"
                >
                  Create a Free Account
                </Link>
                <p className="text-xs text-text-muted text-center">
                  You must use <span className="text-gold">{recipientEmail}</span> to claim this gift.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Questions? <Link href="/contact" className="text-gold hover:text-gold-light">Contact support</Link>
        </p>
      </div>
    </div>
  );
}
