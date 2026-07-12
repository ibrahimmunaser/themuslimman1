import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BrownieStatsDashboard } from "@/components/influencer/brownie-stats-dashboard";
import { getInfluencerPurchases, getInfluencerSubscriptions } from "@/lib/queries/influencer-stats";

export const metadata = { title: "Creator Stats", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

const CREATOR      = "browniesaadi";
const DISPLAY_NAME = "Browniesaadi";

export default async function BrowniesaadiStatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const validKey = process.env.BROWNIESAADI_STATS_KEY;

  if (!validKey || params.key !== validKey) {
    return notFound();
  }

  const now = new Date();

  const [rawClicks, events, purchases, trials] = await Promise.all([
    prisma.influencerClick.count({ where: { creator: CREATOR } }),

    prisma.influencerEvent.findMany({
      where: { creator: CREATOR },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, eventType: true, sessionId: true, visitorId: true,
        plan: true, promoCode: true, amount: true, userEmail: true, metadata: true, createdAt: true,
      },
    }),

    getInfluencerPurchases(CREATOR),
    getInfluencerSubscriptions(CREATOR),
  ]);

  return (
    <BrownieStatsDashboard
      displayName={DISPLAY_NAME}
      rawClicks={rawClicks}
      events={events}
      purchases={purchases.map((p) => ({ ...p, userEmail: p.user.email }))}
      trials={trials.map((t) => ({ ...t, userEmail: t.user.email }))}
      lastUpdated={now}
    />
  );
}
