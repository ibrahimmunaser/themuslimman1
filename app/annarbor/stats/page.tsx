import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BrownieStatsDashboard } from "@/components/influencer/brownie-stats-dashboard";
import type { FunnelStep } from "@/components/influencer/brownie-stats-dashboard";

export const metadata = { title: "Ann Arbor Stats", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

const CREATOR      = "annarbor";
const PROMO_CODE   = "ANNARBOR29";
const DISPLAY_NAME = "Ann Arbor";

const FUNNEL_STEPS: FunnelStep[] = [
  { key: "annarbor_landing_page_view",       label: "Landing Views"              },
  { key: "student_lifetime_cta_clicked",     label: "Clicked Student Lifetime CTA" },
  { key: "watch_part1_clicked",              label: "Clicked Watch Part 1 Free"  },
  { key: "checkout_loaded_student_lifetime", label: "Checkout — Student Lifetime" },
  { key: "change_plan_clicked",              label: "Clicked Change Plan"         },
  { key: "checkout_form_submitted",          label: "Submitted Payment Form"      },
];

export default async function AnnArborStatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params   = await searchParams;
  const validKey = process.env.ANNARBOR_STATS_KEY;

  if (!validKey || params.key !== validKey) return notFound();

  const now = new Date();

  const [rawClicks, events, purchases] = await Promise.all([
    prisma.influencerClick.count({ where: { creator: CREATOR } }),

    prisma.influencerEvent.findMany({
      where: { creator: CREATOR },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, eventType: true, sessionId: true, visitorId: true,
        plan: true, promoCode: true, amount: true, userEmail: true, createdAt: true,
      },
    }),

    prisma.purchase.findMany({
      where: { creator: CREATOR, status: "succeeded" },
      select: {
        id: true, amount: true, createdAt: true, promoCode: true,
        user: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <BrownieStatsDashboard
      displayName={DISPLAY_NAME}
      promoCode={PROMO_CODE}
      rawClicks={rawClicks}
      events={events}
      purchases={purchases.map((p) => ({ ...p, userEmail: p.user.email }))}
      trials={[]}
      lastUpdated={now}
      funnelSteps={FUNNEL_STEPS}
      landingEventKey="annarbor_landing_page_view"
      commissionPerSale={0}
    />
  );
}
