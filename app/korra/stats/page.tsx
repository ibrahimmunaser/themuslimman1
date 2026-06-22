import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BrownieStatsDashboard } from "@/components/influencer/brownie-stats-dashboard";
import type { FunnelStep } from "@/components/influencer/brownie-stats-dashboard";

export const metadata = { title: "Creator Stats", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

const CREATOR      = "korra";
const PROMO_CODE   = "KORRA20";
const DISPLAY_NAME = "Korra";

const FUNNEL_STEPS: FunnelStep[] = [
  { key: "influencer_page_view",          label: "Page Views"           },
  { key: "influencer_primary_cta_click",  label: "Clicked Checkout CTA" },
  { key: "influencer_part1_cta_click",    label: "Clicked Watch Part 1" },
  { key: "influencer_part1_started",      label: "Started Part 1"       },
  { key: "influencer_checkout_cta_click", label: "Part 1 → Checkout"    },
  { key: "payment_started",               label: "Started Payment"      },
  { key: "payment_succeeded",             label: "Payment Succeeded"    },
];

export default async function KorraStatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params   = await searchParams;
  const validKey = process.env.KORRA_STATS_KEY;

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
      landingEventKey="influencer_page_view"
    />
  );
}
