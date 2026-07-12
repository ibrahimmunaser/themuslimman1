import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BrownieStatsDashboard } from "@/components/influencer/brownie-stats-dashboard";
import type { FunnelStep } from "@/components/influencer/brownie-stats-dashboard";
import { getInfluencerPurchases, getInfluencerSubscriptions } from "@/lib/queries/influencer-stats";

export const metadata = { title: "Ann Arbor Stats", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

const CREATOR      = "annarbor";
const DISPLAY_NAME = "Ann Arbor";

const FUNNEL_STEPS: FunnelStep[] = [
  { key: "landing_page_view",            label: "Page Views"               },
  { key: "quiz_started",                 label: "Quiz Started"             },
  { key: "quiz_completed",               label: "Quiz Completed"           },
  { key: "quiz_email_submitted",         label: "Email Submitted"          },
  { key: "quiz_recommended_cta_clicked", label: "CTA Clicked"              },
  { key: "checkout_loaded",              label: "Checkout Loaded"          },
  { key: "payment_succeeded",            label: "Payment Succeeded"        },
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

    getInfluencerPurchases(CREATOR),
  ]);

  return (
    <BrownieStatsDashboard
      displayName={DISPLAY_NAME}
      rawClicks={rawClicks}
      events={events}
      purchases={purchases.map((p) => ({ ...p, userEmail: p.user.email }))}
      trials={[]}
      lastUpdated={now}
      funnelSteps={FUNNEL_STEPS}
      landingEventKey="landing_page_view"
      commissionPerSale={0}
    />
  );
}
