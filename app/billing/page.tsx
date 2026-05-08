import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StudentLayout } from "@/components/student/student-layout";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { CardManager } from "@/components/billing/card-manager";
import {
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Receipt,
  ShieldCheck,
  Star,
  Lock,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Billing | Seerah Masterclass" };
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

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id, status: "succeeded" },
    orderBy: { createdAt: "desc" },
  });

  if (purchases.length === 0) redirect("/pricing");

  const userPlan = "complete" as const;
  const plan = PLANS.complete;

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text">Billing &amp; Plan</h1>
          <p className="text-text-secondary text-sm mt-1">
            Your plan details and purchase history.
          </p>
        </div>

        {/* Current plan card */}
        <div className="rounded-2xl border p-6 border-gold/30 bg-gold/5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gold/15">
                <Star className="w-5 h-5 text-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-text">{plan.name}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                    Active
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-0.5">{plan.subtitle}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">One-time payment</p>
              <p className="text-sm font-semibold text-text mt-0.5">Lifetime access</p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-5 grid sm:grid-cols-2 gap-y-2 gap-x-4">
            {plan.features.slice(0, 8).map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Card manager */}
        <CardManager />

        {/* Purchase history */}
        <div>
          <h2 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-text-muted" />
            Purchase History
          </h2>
          <div className="rounded-xl border border-border overflow-hidden">
            {purchases.map((purchase, i) => (
              <div
                key={purchase.id}
                className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}
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

        {/* Help section */}
        <div className="rounded-xl border border-border bg-surface p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-surface-raised flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lock className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Questions about your purchase?</p>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              All purchases come with a 7-day refund guarantee. For receipts, refund requests, or billing questions,{" "}
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
