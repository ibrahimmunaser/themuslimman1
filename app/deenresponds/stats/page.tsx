import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { InfluencerStatsPage } from "@/components/influencer/influencer-stats-page";

export const dynamic = "force-dynamic";

const CREATOR = "deenresponds";
const PROMO_CODE = "DEEN20";
const DISPLAY_NAME = "Deen Responds";

export default async function DeenRespondsStatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const key = params.key;
  const validKey = process.env.INFLUENCER_STATS_KEY;

  if (!validKey || key !== validKey) {
    return notFound();
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalClicks, clicksThisWeek, clicksThisMonth, rawPurchases] =
    await Promise.all([
      prisma.influencerClick.count({ where: { creator: CREATOR } }),
      prisma.influencerClick.count({ where: { creator: CREATOR, clickedAt: { gte: weekAgo } } }),
      prisma.influencerClick.count({ where: { creator: CREATOR, clickedAt: { gte: monthAgo } } }),
      prisma.purchase.findMany({
        where: { creator: CREATOR, status: "succeeded" },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true } } },
      }),
    ]);

  const purchases = rawPurchases.map((p) => ({
    id: p.id,
    amount: p.amount,
    currency: p.currency,
    createdAt: p.createdAt,
    userEmail: p.user.email,
    promoCode: p.promoCode,
  }));

  return (
    <InfluencerStatsPage
      creatorSlug={CREATOR}
      displayName={DISPLAY_NAME}
      promoCode={PROMO_CODE}
      totalClicks={totalClicks}
      clicksThisWeek={clicksThisWeek}
      clicksThisMonth={clicksThisMonth}
      purchases={purchases}
    />
  );
}
