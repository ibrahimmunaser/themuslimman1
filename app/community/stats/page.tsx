import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { InfluencerStatsPage } from "@/components/influencer/influencer-stats-page";

export const metadata = { title: "Community Stats", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

const CREATOR      = "community";
const PROMO_CODE   = "COMMUNITY49 / COMMUNITY99";
const DISPLAY_NAME = "Community";

export default async function CommunityStatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params   = await searchParams;
  const validKey = process.env.COMMUNITY_STATS_KEY;

  if (!validKey || params.key !== validKey) {
    return notFound();
  }

  const now = new Date();

  const [totalClicks, purchases] = await Promise.all([
    prisma.influencerClick.count({ where: { creator: CREATOR } }),
    prisma.purchase.findMany({
      where: { creator: CREATOR, status: "succeeded" },
      select: { id: true, amount: true, createdAt: true, user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <InfluencerStatsPage
      displayName={DISPLAY_NAME}
      promoCode={PROMO_CODE}
      totalClicks={totalClicks}
      totalPurchases={purchases.length}
      commissionCents={0}
      lastUpdated={now}
      purchases={purchases.map((p) => ({ ...p, userEmail: p.user.email }))}
    />
  );
}
