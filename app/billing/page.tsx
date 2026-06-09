import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserAccessInfo } from "@/lib/access";
import { StudentLayout } from "@/components/student/student-layout";
import { PLANS } from "@/lib/stripe-config";
import { CardManager } from "@/components/billing/card-manager";
import { PortalButton } from "@/components/billing/portal-button";
import { CancelSubscriptionButton } from "@/components/billing/cancel-subscription-button";
import {
  CreditCard,
  CheckCircle2,
  Receipt,
  Star,
  Lock,
  RefreshCw,
  Users,
  ArrowRight,
  ArrowUpCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Billing | Complete Seerah", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function BillingPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  // Parallelize access info + purchase history — saves one sequential round-trip.
  const [accessInfo, purchases] = await Promise.all([
    getUserAccessInfo(user.id, user.hasPaid),
    prisma.purchase.findMany({
      where: { userId: user.id, status: "succeeded" },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!accessInfo.hasAccess) redirect("/pricing");

  const userPlan = "complete" as const;

  const isFamily          = user.planType === "family";
  const isMonthly         = !accessInfo.hasLifetime && accessInfo.hasActiveSubscription;
  const isTrial           = isMonthly && accessInfo.subscription?.status === "trialing";
  const isFamilyLifetime  = isFamily && !isMonthly;
  const isFamilyMonthly   = isFamily && isMonthly;
  const sub               = accessInfo.subscription;
  const isPastDue         = sub?.status === "past_due";

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName} planType={user.planType}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text">Billing &amp; Plan</h1>
          <p className="text-text-secondary text-sm mt-1">Your plan details and billing history.</p>
        </div>

        {/* Payment failed warning — shown when monthly renewal bounces */}
        {isPastDue && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-500/15 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-400">Payment failed — please update your card</p>
              <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                Your last monthly payment didn&apos;t go through. We&apos;re retrying automatically — you still have access.
                To avoid losing access, please update your payment method before retries are exhausted.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <PortalButton />
                <Link href="/help" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text text-sm transition-colors">
                  Contact support
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Current plan card */}
        <div className="rounded-2xl border p-6 border-gold/30 bg-gold/5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gold/15">
                {isMonthly ? <RefreshCw className="w-5 h-5 text-gold" /> : <Star className="w-5 h-5 text-gold" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-text">
                    {isFamilyMonthly && isTrial
                      ? PLANS.familyTrial.name
                      : isFamilyMonthly
                      ? PLANS.familyMonthly.name
                      : isFamilyLifetime
                      ? PLANS.family.name
                      : isMonthly && isTrial
                      ? PLANS.individualTrial.name
                      : isMonthly
                      ? PLANS.monthly.name
                      : PLANS.complete.name}
                  </p>
                  {isPastDue ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      Past due
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-0.5">
                  {isFamilyMonthly || isFamilyLifetime
                    ? PLANS.family.subtitle
                    : isTrial
                    ? PLANS.individualTrial.subtitle
                    : isMonthly
                    ? PLANS.monthly.subtitle
                    : PLANS.complete.subtitle}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isFamilyMonthly && isTrial ? (
                <>
                  <p className="text-xs text-text-muted">$1 today · then $19/mo</p>
                  {sub && (
                    <p className="text-xs text-text-muted mt-0.5">
                      Trial ends {formatDate(sub.currentPeriodEnd)}
                    </p>
                  )}
                </>
              ) : isFamilyMonthly ? (
                <>
                  <p className="text-xs text-text-muted">$19 / month</p>
                  {sub && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {sub.cancelAtPeriodEnd
                        ? `Cancels ${formatDate(sub.currentPeriodEnd)}`
                        : `Renews ${formatDate(sub.currentPeriodEnd)}`}
                    </p>
                  )}
                </>
              ) : isMonthly && isTrial ? (
                <>
                  <p className="text-xs text-text-muted">$1 today · then $9/mo</p>
                  {sub && (
                    <p className="text-xs text-text-muted mt-0.5">
                      Trial ends {formatDate(sub.currentPeriodEnd)}
                    </p>
                  )}
                </>
              ) : isMonthly ? (
                <>
                  <p className="text-xs text-text-muted">$9 / month</p>
                  {sub && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {sub.cancelAtPeriodEnd
                        ? `Cancels ${formatDate(sub.currentPeriodEnd)}`
                        : `Renews ${formatDate(sub.currentPeriodEnd)}`}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-text-muted">One-time payment</p>
                  <p className="text-sm font-semibold text-text mt-0.5">Lifetime access</p>
                </>
              )}
            </div>
          </div>

          {isMonthly && sub?.cancelAtPeriodEnd && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
              Your subscription is set to cancel on {formatDate(sub.currentPeriodEnd)}. You&apos;ll retain access until then.
            </div>
          )}

          {/* Cancel button — shown for all active monthly/trial subscribers who haven't cancelled yet */}
          {isMonthly && sub && !sub.cancelAtPeriodEnd && (
            <div className="mt-5">
              <CancelSubscriptionButton
                cancelDate={sub.currentPeriodEnd.toISOString()}
                isTrial={isTrial}
              />
            </div>
          )}

          <div className="mt-5 grid sm:grid-cols-2 gap-y-2 gap-x-4">
            {(isFamilyMonthly
              ? PLANS.familyMonthly.features
              : isFamilyLifetime
              ? PLANS.family.features
              : isTrial
              ? PLANS.monthly.features
              : isMonthly
              ? PLANS.monthly.features
              : PLANS.complete.features
            ).slice(0, 8).map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Family Monthly → Lifetime upgrade nudge */}
        {isFamilyMonthly && (
          <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gold/15">
                <Star className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text">Upgrade to Family Lifetime</p>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  Stop paying monthly. Get permanent Family Access for a one-time payment of $149 —
                  the same 5 learner profiles, separate progress for every course asset, lifetime access.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href="/checkout?plan=family&billing=lifetime"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-black font-bold text-sm transition-colors shadow-sm"
                  >
                    Upgrade for $149
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-text-muted">One-time payment · Cancel your monthly subscription after</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Lifetime → Family Lifetime upgrade card (pays only the $70 difference) */}
        {accessInfo.hasLifetime && !isFamily && !isMonthly && !isTrial && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-500/15">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text">Upgrade to Family Access</p>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  Family Access gives one household account with up to 5 learner profiles.
                  Parents log in once, create profiles for each family member, and each learner
                  gets their own separate progress for all course assets.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-400/80">
                  <ArrowUpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  You&apos;ve already paid $79 for Individual Lifetime — you&apos;re only paying the $70 difference.
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href="/checkout?plan=family&billing=lifetime"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors shadow-sm"
                  >
                    Upgrade for $70
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-text-muted">
                    <span className="line-through opacity-60 mr-1">$149</span>
                    One-time · Lifetime family access
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Monthly/Trial → Lifetime upgrade cards */}
        {!accessInfo.hasLifetime && !isFamily && isMonthly && (
          <>
            {/* Upgrade to Individual Lifetime */}
            <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gold/15">
                  <Star className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text">Upgrade to Individual Lifetime</p>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                    Stop paying monthly. Get permanent access to all 100 Seerah parts for a one-time
                    payment of $79 — no more recurring charges, yours forever.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      href="/checkout?plan=individual-lifetime"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-black font-bold text-sm transition-colors shadow-sm"
                    >
                      Lifetime Access — $79
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <span className="text-xs text-text-muted">One-time payment · cancel your trial after</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade to Family Access */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-500/15">
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text">Upgrade to Family Access</p>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                    One household account with up to 5 learner profiles,
                    separate progress for every learner, and your choice of monthly or lifetime billing.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      href="/checkout?plan=family-lifetime"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors shadow-sm"
                    >
                      Lifetime — $149
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/checkout?plan=family-trial"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-500/40 hover:border-amber-500/70 text-amber-400 font-semibold text-sm transition-colors"
                    >
                      Try for $1 · $19/mo after
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Card manager — show for lifetime buyers; monthly/trial users manage cards via Stripe portal */}
        {accessInfo.hasLifetime && !isTrial && <CardManager />}

        {/* Purchase history */}
        {purchases.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-text-muted" />
              Purchase History
            </h2>
            <div className="rounded-xl border border-border overflow-hidden">
              {purchases.map((purchase, i) => (
                <div
                  key={purchase.id}
                  className={`flex items-center gap-4 px-4 sm:px-5 py-4 min-h-[60px] ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">{purchase.planName}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {formatDate(purchase.createdAt)}
                      <span className="mx-1.5 opacity-30">·</span>
                      ID: <span className="font-mono">{purchase.stripePaymentIntentId.slice(-8)}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-text">
                      {formatAmount(purchase.amount, purchase.currency)}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Paid
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help section */}
        <div className="rounded-xl border border-border bg-surface p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-surface-raised flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lock className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Questions about billing?</p>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              For receipts, refund requests, subscription changes, or billing questions,{" "}
              <Link href="/help" className="text-gold hover:text-gold-light underline underline-offset-2">
                contact support
              </Link>
              .
            </p>
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}
