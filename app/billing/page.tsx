import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserAccessInfo } from "@/lib/access";
import { StudentLayout } from "@/components/student/student-layout";
import { PLANS } from "@/lib/stripe-config";
import { CardManager } from "@/components/billing/card-manager";
import { PortalButton } from "@/components/billing/portal-button";
import { CancelSubscriptionButton } from "@/components/billing/cancel-subscription-button";
import { ReactivateSubscriptionButton } from "@/components/billing/reactivate-subscription-button";
import { UpgradeToFamilyMonthlyButton } from "@/components/billing/upgrade-to-family-monthly-button";
import {
  CreditCard,
  CheckCircle2,
  Receipt,
  Star,
  Lock,
  RefreshCw,
  Users,
  ArrowRight,
  ArrowLeft,
  ArrowUpCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { parseLang, COURSE_LANG_COOKIE } from "@/lib/course-lang";

export const metadata = { title: "Billing | Complete Seerah", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatDate(d: Date, ar: boolean) {
  if (ar) {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
      numberingSystem: "arab",
    }).format(d);
  }
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

export default async function BillingPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const params = await searchParams;
  const upgradedPlan = typeof params.upgraded === "string" ? params.upgraded : null;
  // Mobile in-app WebView opens /billing?app=1 — hide Stripe upgrade CTAs so
  // Guideline 3.1.1 / Play billing rules aren't violated by in-WebView checkout
  // (CSS also hides /checkout links as defense in depth).
  const fromMobileApp = params.app === "1" || params.app === "true";

  // Parallelize access info + purchase history — saves one sequential round-trip.
  const [accessInfo, purchases] = await Promise.all([
    getUserAccessInfo(user.id, user.hasPaid),
    prisma.purchase.findMany({
      where: { userId: user.id, status: "succeeded" },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  // Course access is NOT required here. After a failed renewal, past_due users
  // keep course access only for the ~7-day grace window — then hasAccess flips
  // false while Stripe is still retrying / waiting for a new card. Redirecting
  // them to /pricing would lock them out of the only page that can fix payment
  // (and checkout itself refuses a second sub while status is still past_due).
  // unpaid is the same recovery case after Stripe finalizes the dunning cycle.
  const needsBillingRecovery =
    accessInfo.subscription?.status === "past_due" ||
    accessInfo.subscription?.status === "unpaid";
  if (!accessInfo.hasAccess && !needsBillingRecovery) redirect("/pricing");

  // Mobile IAP users manage billing in the App Store / Play Store — never show
  // Stripe portal/upgrade CTAs that contradict store billing rules.
  const isStorePurchase =
    accessInfo.purchasePlatform === "apple" || accessInfo.purchasePlatform === "google";
  const hideStripeBilling = fromMobileApp || isStorePurchase;

  // Audit M2 fix: this emailVerified redirect used to run unconditionally,
  // BEFORE needsBillingRecovery was even computed — so a guest-checkout
  // subscriber (app/api/auth/guest-checkout sets emailVerified: false; they
  // set a password later via the emailed link but never necessarily click
  // "verify") whose card failed got bounced straight to /seerah instead of
  // reaching the one page that can fix their payment method, right when
  // hasAccess is already false too — a dead-end loop with literally no path
  // back to a working card. Exempt the same past_due/unpaid recovery cohort
  // hasAccess already is above.
  // Paid / entitled users may reach billing without emailVerified (Stripe guest
  // checkout, IAP upgrade). Only bounce unpaid unverified users away.
  if (!user.emailVerified && !needsBillingRecovery && !accessInfo.hasAccess) redirect("/seerah");

  // ── Individual → Family upgrade pricing ──────────────────────────────────────
  // Standard upgrade cost: $30 (full $79 family − full $49 individual). Promo
  // codes are no longer offered, so every upgrade uses this flat pricing.
  const individualPurchase = purchases.find((p) => p.planId === "complete");
  const individualPaidCents = individualPurchase?.amount ?? PLANS.complete.price;
  const upgradeCostCents: number = PLANS.family.upgradeFromLifetimePrice; // $30
  // familyReferenceCents = what the user would pay for Family if buying fresh today.
  // Used as the strikethrough "instead of X" reference in the upgrade card.
  const familyReferenceCents: number = PLANS.family.price; // $79

  const upgradeUrl = "/checkout?plan=family-lifetime";

  const fmtCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "usd", minimumFractionDigits: 0 }).format(cents / 100);

  const userPlan = "complete" as const;
  const cookieStore = await cookies();
  const lang = parseLang(cookieStore.get(COURSE_LANG_COOKIE)?.value);
  const ar = lang === "ar";
  const UpgradeIcon = ar ? ArrowLeft : ArrowRight;

  const isFamily          = user.planType === "family";
  // Treat past_due/unpaid monthly subs as monthly even after grace expires —
  // hasActiveSubscription is false once grace ends (course access revoked),
  // but the Stripe subscription row is still there and the billing page must
  // keep showing the monthly plan + payment-failure recovery UI, not fall
  // through to the lifetime card.
  const hasOpenMonthlySub =
    accessInfo.subscription?.status === "past_due" ||
    accessInfo.subscription?.status === "unpaid" ||
    accessInfo.subscription?.status === "active" ||
    accessInfo.subscription?.status === "trialing";
  const isMonthly         = !accessInfo.hasLifetime && (accessInfo.hasActiveSubscription || hasOpenMonthlySub);
  const isTrial           = isMonthly && accessInfo.subscription?.status === "trialing";
  const isFamilyLifetime  = isFamily && !isMonthly;
  const isFamilyMonthly   = isFamily && isMonthly;
  const sub               = accessInfo.subscription;
  const isPastDue         = sub?.status === "past_due" || sub?.status === "unpaid";

  const planName = isFamilyMonthly && isTrial
    ? (ar ? "تجربة العائلة" : PLANS.familyTrial.name)
    : isFamilyMonthly
    ? (ar ? "عضوية العائلة" : PLANS.familyMonthly.name)
    : isFamilyLifetime
    ? (ar ? "وصول العائلة" : PLANS.family.name)
    : isMonthly && isTrial
    ? (ar ? "تجربة فردية" : PLANS.individualTrial.name)
    : isMonthly
    ? (ar ? "العضوية الفردية" : PLANS.monthly.name)
    : (ar ? "السيرة النبوية الكاملة" : PLANS.complete.name);

  const planSubtitle = isFamilyMonthly || isFamilyLifetime
    ? (ar ? "حساب واحد للأسرة مع حتى ٥ ملفات متعلّمين" : PLANS.family.subtitle)
    : isTrial
    ? (ar ? "٧ أيام من الوصول الكامل" : PLANS.individualTrial.subtitle)
    : isMonthly
    ? (ar ? "وصول كامل طوال فترة الاشتراك" : PLANS.monthly.subtitle)
    : (ar ? "وصول كامل إلى رحلة السيرة المنظمة في ١٠٠ جزء" : PLANS.complete.subtitle);

  const FEATURES_AR: Record<string, string> = {
    "All 100 Seerah parts": "جميع أجزاء السيرة الـ ١٠٠",
    "Video lessons": "دروس الفيديو",
    "Audio lessons": "الدروس الصوتية",
    "Summaries and briefings": "الملخصات والموجزات",
    "Quizzes": "الاختبارات",
    "Flashcards": "البطاقات التعليمية",
    "Mind maps": "الخرائط الذهنية",
    "Visual learning resources": "موارد التعلم المرئية",
    "Progress tracking": "تتبع التقدم",
    "Lifetime access to the full course": "وصول مدى الحياة إلى الدورة كاملة",
    "Start today. Continue at your own pace.": "ابدأ اليوم. وتابع بالوتيرة التي تناسبك.",
    "Videos, quizzes, flashcards, mind maps": "فيديوهات واختبارات وبطاقات تعليمية وخرائط ذهنية",
    "Progress dashboard · Mobile friendly": "لوحة تقدّم · مناسب للجوال",
    "Cancel anytime": "ألغِ في أي وقت",
    "One household account": "حساب واحد للأسرة",
    "Up to 5 learner profiles": "حتى ٥ ملفات متعلّمين",
    "Separate progress for every course asset": "تقدّم منفصل لكل مورد في الدورة",
    "Video, audio, briefings, slides, infographics": "فيديو وصوت وملخصات وشرائح ورسوم معلوماتية",
    "Quizzes, flashcards, and mind maps": "اختبارات وبطاقات تعليمية وخرائط ذهنية",
    "Parent progress dashboard": "لوحة تقدّم للأهل",
    "Easy profile switching": "تبديل سهل بين الملفات",
    "Start today. Everyone learns at their own pace.": "ابدأ اليوم. يتعلّم الجميع بوتيرته.",
    "Up to 5 separate learner profiles": "حتى ٥ ملفات متعلّمين منفصلة",
    "Each profile tracks progress independently": "كل ملف يتتبع تقدّمه بشكل مستقل",
  };

  const planFeatures = (isFamilyMonthly
    ? PLANS.familyMonthly.features
    : isFamilyLifetime
    ? PLANS.family.features
    : isTrial
    ? PLANS.monthly.features
    : isMonthly
    ? PLANS.monthly.features
    : PLANS.complete.features
  ).slice(0, 8).map((f) => (ar ? (FEATURES_AR[f] ?? f) : f));

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName} planType={user.planType}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8" dir={ar ? "rtl" : undefined}>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text">{ar ? "الفواتير والخطة" : "Billing & Plan"}</h1>
          <p className="text-text-secondary text-sm mt-1">{ar ? "تفاصيل خطتك وسجل الفواتير." : "Your plan details and billing history."}</p>
        </div>

        {/* Upgrade success confirmation */}
        {upgradedPlan === "family-monthly" && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/15 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-emerald-400">{ar ? "تمت الترقية إلى عضوية العائلة الشهرية" : "Upgraded to Family Monthly"}</p>
              <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                {ar
                  ? `تمت ترقية خطتك إلى عضوية العائلة الشهرية — ${(PLANS.familyMonthly.price / 100).toFixed(2)}$/شهر. سيتم تحصيل المبلغ من بطاقتك الحالية في تاريخ الفوترة القادم، وسيتولى Stripe حساب أي فرق تلقائيًا.`
                  : `Your plan has been upgraded to Family Monthly — $${(PLANS.familyMonthly.price / 100).toFixed(2)}/mo. Your existing card will be charged at the next billing date with Stripe handling any proration automatically.`}
              </p>
            </div>
          </div>
        )}

        {/* Payment failed warning — shown when monthly renewal bounces */}
        {isPastDue && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-500/15 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-400">{ar ? "فشل الدفع — يرجى تحديث بطاقتك" : "Payment failed — please update your card"}</p>
              <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                {ar
                  ? (accessInfo.hasAccess
                    ? "لم ينجح آخر دفع شهري. نحن نعيد المحاولة تلقائياً — لا يزال وصولك متاحاً الآن. حدّث طريقة الدفع حتى لا تفقد الوصول."
                    : "لم ينجح آخر دفع شهري وتم إيقاف الوصول إلى الدورة. حدّث طريقة الدفع أدناه — بمجرد نجاح الدفع، يُستعاد الوصول تلقائياً.")
                  : (accessInfo.hasAccess
                    ? "Your last monthly payment didn\u2019t go through. We\u2019re retrying automatically — you still have access for now. Update your payment method so you don\u2019t lose access when retries run out."
                    : "Your last monthly payment didn\u2019t go through and course access is paused. Update your payment method below — once the charge succeeds, access is restored automatically.")}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {!hideStripeBilling && (
                  <PortalButton label={ar ? "تحديث طريقة الدفع" : "Update payment method"} variant="alert" lang={lang} />
                )}
                <Link href="/help" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text text-sm transition-colors">
                  {ar ? "تواصل مع الدعم" : "Contact support"}
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
                    {planName}
                  </p>
                  {isPastDue ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      {ar ? "متأخر" : "Past due"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                      {ar ? "نشط" : "Active"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-0.5">
                  {planSubtitle}
                </p>
              </div>
            </div>
            <div className="text-end">
              {isFamilyMonthly && isTrial ? (
                <>
                  <p className="text-xs text-text-muted">{ar ? `مجاني الآن · ثم $${(PLANS.familyMonthly.price / 100).toFixed(2)}/شهر` : `Free today · then $${(PLANS.familyMonthly.price / 100).toFixed(2)}/mo`}</p>
                  {sub && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {ar ? `تنتهي الفترة التجريبية: ${formatDate(sub.currentPeriodEnd, ar)}` : `Trial ends ${formatDate(sub.currentPeriodEnd, ar)}`}
                    </p>
                  )}
                </>
              ) : isFamilyMonthly ? (
                <>
                  <p className="text-xs text-text-muted">${(PLANS.familyMonthly.price / 100).toFixed(2)} / {ar ? "شهر" : "month"}</p>
                  {sub && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {ar
                        ? (sub.cancelAtPeriodEnd ? `ينتهي: ${formatDate(sub.currentPeriodEnd, ar)}` : `يُجدَّد: ${formatDate(sub.currentPeriodEnd, ar)}`)
                        : (sub.cancelAtPeriodEnd ? `Cancels ${formatDate(sub.currentPeriodEnd, ar)}` : `Renews ${formatDate(sub.currentPeriodEnd, ar)}`)}
                    </p>
                  )}
                </>
              ) : isMonthly && isTrial ? (
                <>
                  <p className="text-xs text-text-muted">{ar ? `مجاني الآن · ثم $${(PLANS.monthly.price / 100).toFixed(2)}/شهر` : `Free today · then $${(PLANS.monthly.price / 100).toFixed(2)}/mo`}</p>
                  {sub && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {ar ? `تنتهي الفترة التجريبية: ${formatDate(sub.currentPeriodEnd, ar)}` : `Trial ends ${formatDate(sub.currentPeriodEnd, ar)}`}
                    </p>
                  )}
                </>
              ) : isMonthly ? (
                <>
                  <p className="text-xs text-text-muted">${(PLANS.monthly.price / 100).toFixed(2)} / {ar ? "شهر" : "month"}</p>
                  {sub && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {ar
                        ? (sub.cancelAtPeriodEnd ? `ينتهي: ${formatDate(sub.currentPeriodEnd, ar)}` : `يُجدَّد: ${formatDate(sub.currentPeriodEnd, ar)}`)
                        : (sub.cancelAtPeriodEnd ? `Cancels ${formatDate(sub.currentPeriodEnd, ar)}` : `Renews ${formatDate(sub.currentPeriodEnd, ar)}`)}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-text-muted">{ar ? "دفعة واحدة" : "One-time payment"}</p>
                  <p className="text-sm font-semibold text-text mt-0.5">{ar ? "وصول مدى الحياة" : "Lifetime access"}</p>
                </>
              )}
            </div>
          </div>

          {isMonthly && sub?.cancelAtPeriodEnd && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-2">
              <p className="text-amber-400 text-xs">
                {ar
                  ? `اشتراكك مُحدَّد للإلغاء في ${formatDate(sub.currentPeriodEnd, ar)}. ستحتفظ بالوصول حتى ذلك الحين.`
                  : `Your subscription is set to cancel on ${formatDate(sub.currentPeriodEnd, ar)}. You'll retain access until then.`}
              </p>
              <ReactivateSubscriptionButton isTrial={isTrial} lang={lang} />
            </div>
          )}

          {/* Cancel button — shown for Stripe monthly/trial only (not App Store / Play) */}
          {!hideStripeBilling && isMonthly && sub && !sub.cancelAtPeriodEnd && (
            <div className="mt-5">
              <CancelSubscriptionButton
                cancelDate={sub.currentPeriodEnd.toISOString()}
                isTrial={isTrial}
                lang={lang}
              />
            </div>
          )}

          {/* Manage billing — Stripe portal only when purchasePlatform is stripe */}
          {!hideStripeBilling && isMonthly && (
            <div className="mt-5 pt-5 border-t border-border/60 flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-text-muted">
                {ar ? "حدّث بطاقتك، اعرض الفواتير، أو غيّر تفاصيل الفوترة." : "Update your card, view invoices, or change billing details."}
              </p>
              <PortalButton label={ar ? "إدارة الفواتير" : "Manage billing"} variant="default" lang={lang} />
            </div>
          )}

          {isStorePurchase && isMonthly && (
            <div className="mt-5 pt-5 border-t border-border/60">
              <p className="text-xs text-text-muted">
                {ar
                  ? `اشتراكك يُفوتَر عبر ${accessInfo.purchasePlatform === "apple" ? "App Store" : "Google Play Store"}. أدِر أو ألغِ الاشتراك من إعدادات الاشتراكات على جهازك.`
                  : `Your subscription is billed through the ${accessInfo.purchasePlatform === "apple" ? "App Store" : "Google Play Store"}. Manage or cancel it in your device's subscription settings.`}
              </p>
            </div>
          )}

          <div className="mt-5 grid sm:grid-cols-2 gap-y-2 gap-x-4">
            {planFeatures.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Family Monthly → Lifetime upgrade nudge */}
        {!hideStripeBilling && isFamilyMonthly && (
          <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gold/15">
                <Star className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text">{ar ? "الترقية إلى وصول العائلة مدى الحياة" : "Upgrade to Family Lifetime"}</p>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  {ar
                    ? "توقّف عن الدفع الشهري. احصل على وصول العائلة الدائم بدفعة واحدة بقيمة $79 — نفس الـ ٥ ملفات المتعلّمين، تقدّم منفصل لكل مورد، وصول مدى الحياة."
                    : "Stop paying monthly. Get permanent Family Access for a one-time payment of $79 — the same 5 learner profiles, separate progress for every course asset, lifetime access."}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href="/checkout?plan=family&billing=lifetime"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-black font-bold text-sm transition-colors shadow-sm"
                  >
                    {ar ? "الترقية بـ $79" : "Upgrade for $79"}
                    <UpgradeIcon className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-text-muted">
                    {ar ? "دفعة واحدة · يُلغى الاشتراك الشهري تلقائيًا" : "One-time · Monthly subscription cancelled automatically"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Lifetime → Family Lifetime upgrade card */}
        {!hideStripeBilling && accessInfo.hasLifetime && !isFamily && !isMonthly && !isTrial && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-500/15">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text">{ar ? "الترقية إلى وصول العائلة" : "Upgrade to Family Access"}</p>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  {ar
                    ? "وصول العائلة يمنح حسابًا واحدًا للأسرة مع حتى ٥ ملفات متعلّمين. يسجّل الأهل الدخول مرة واحدة، وينشئون ملفًا لكل فرد، ولكل متعلّم تقدّم منفصل في جميع موارد الدورة."
                    : "Family Access gives one household account with up to 5 learner profiles. Parents log in once, create profiles for each family member, and each learner gets their own separate progress for all course assets."}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-400/80">
                  <ArrowUpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {ar
                    ? `لقد دفعت بالفعل ${fmtCurrency(individualPaidCents)} للوصول الفردي مدى الحياة — تدفع فقط فرق ${fmtCurrency(upgradeCostCents)}.`
                    : `You've already paid ${fmtCurrency(individualPaidCents)} for Individual Lifetime — you're only paying the ${fmtCurrency(upgradeCostCents)} difference.`}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href={upgradeUrl}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors shadow-sm"
                  >
                    {ar ? `الترقية بـ ${fmtCurrency(upgradeCostCents)}` : `Upgrade for ${fmtCurrency(upgradeCostCents)}`}
                    <UpgradeIcon className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-text-muted">
                    <span className="line-through opacity-60 me-1">{fmtCurrency(familyReferenceCents)}</span>
                    {ar ? "دفعة واحدة · وصول عائلي مدى الحياة" : "One-time · Lifetime family access"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Monthly/Trial → Lifetime upgrade cards */}
        {!hideStripeBilling && !accessInfo.hasLifetime && !isFamily && isMonthly && !isPastDue && (
          <>
            {/* Upgrade to Individual Lifetime */}
            <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gold/15">
                  <Star className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text">{ar ? "الترقية إلى الوصول الفردي مدى الحياة" : "Upgrade to Individual Lifetime"}</p>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                    {ar
                      ? "توقّف عن الدفع الشهري. احصل على وصول دائم لجميع أجزاء السيرة الـ ١٠٠ بدفعة واحدة بقيمة $49 — بلا رسوم متكررة، لك إلى الأبد."
                      : "Stop paying monthly. Get permanent access to all 100 Seerah parts for a one-time payment of $49 — no more recurring charges, yours forever."}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      href="/checkout?plan=individual-lifetime"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-black font-bold text-sm transition-colors shadow-sm"
                    >
                      {ar ? "وصول مدى الحياة — $49" : "Lifetime Access — $49"}
                      <UpgradeIcon className="w-4 h-4" />
                    </Link>
                    <span className="text-xs text-text-muted">
                      {ar ? "دفعة واحدة · يُلغى الاشتراك تلقائيًا" : "One-time · Subscription cancelled automatically"}
                    </span>
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
                  <p className="font-semibold text-text">{ar ? "الترقية إلى وصول العائلة" : "Upgrade to Family Access"}</p>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                    {ar
                      ? "حساب واحد للأسرة مع حتى ٥ ملفات متعلّمين، تقدّم منفصل لكل متعلّم، واختيار بين الفوترة الشهرية أو مدى الحياة."
                      : "One household account with up to 5 learner profiles, separate progress for every learner, and your choice of monthly or lifetime billing."}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      href="/checkout?plan=family-lifetime"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors shadow-sm"
                    >
                      {ar ? "مدى الحياة — $79" : "Lifetime — $79"}
                      <UpgradeIcon className="w-4 h-4" />
                    </Link>
                    <UpgradeToFamilyMonthlyButton lang={lang} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Card manager — Stripe saved cards only (not App Store / Play) */}
        {!hideStripeBilling && accessInfo.hasLifetime && !isTrial && <CardManager lang={lang} />}

        {/* Purchase history */}
        {purchases.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-text-muted" />
              {ar ? "سجل المشتريات" : "Purchase History"}
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
                      {formatDate(purchase.createdAt, ar)}
                      <span className="mx-1.5 opacity-30">·</span>
                      ID: <span className="font-mono">{purchase.stripePaymentIntentId.slice(-8)}</span>
                    </p>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <p className="text-sm font-semibold text-text">
                      {formatAmount(purchase.amount, purchase.currency)}
                    </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      {ar ? "مدفوع" : "Paid"}
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
            <p className="text-sm font-semibold text-text">{ar ? "أسئلة حول الفواتير؟" : "Questions about billing?"}</p>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              {ar
                ? <>للإيصالات وطلبات الاسترداد وتغييرات الاشتراك أو أسئلة الفوترة،{" "}<Link href="/help" className="text-gold hover:text-gold-light underline underline-offset-2">تواصل مع الدعم</Link>.</>
                : <>For receipts, refund requests, subscription changes, or billing questions,{" "}<Link href="/help" className="text-gold hover:text-gold-light underline underline-offset-2">contact support</Link>.</>}
            </p>
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}
