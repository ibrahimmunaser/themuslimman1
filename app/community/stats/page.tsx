import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BrownieStatsDashboard } from "@/components/influencer/brownie-stats-dashboard";
import type { FunnelStep } from "@/components/influencer/brownie-stats-dashboard";

export const metadata = { title: "Community Stats", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

const CREATOR      = "community";
const PROMO_CODE   = "COMMUNITY49 / COMMUNITY99";
const DISPLAY_NAME = "Community";

const FUNNEL_STEPS: FunnelStep[] = [
  { key: "landing_page_view",            label: "Page Views"               },
  { key: "quiz_started",                 label: "Quiz Started"             },
  { key: "quiz_completed",               label: "Quiz Completed"           },
  { key: "quiz_email_submitted",         label: "Email Submitted"          },
  { key: "quiz_recommended_cta_clicked", label: "CTA Clicked"              },
  { key: "checkout_loaded",              label: "Checkout Loaded"          },
  { key: "payment_succeeded",            label: "Payment Succeeded"        },
];

export default async function CommunityStatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params   = await searchParams;
  const validKey = process.env.COMMUNITY_STATS_KEY;

  if (!validKey || params.key !== validKey) return notFound();

  const now = new Date();

  const [rawClicks, events, purchases, trials] = await Promise.all([
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

    prisma.subscription.findMany({
      where: { creator: CREATOR },
      select: {
        id: true, createdAt: true, promoCode: true,
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
      trials={trials.map((t) => ({ ...t, userEmail: t.user.email }))}
      lastUpdated={now}
      funnelSteps={FUNNEL_STEPS}
      landingEventKey="landing_page_view"
      commissionPerSale={0}
    />
  );
}
