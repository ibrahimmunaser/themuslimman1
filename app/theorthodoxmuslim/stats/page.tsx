import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { InfluencerStatsPage } from "@/components/influencer/influencer-stats-page";

export const dynamic = "force-dynamic";

const CREATOR = "theorthodoxmuslim";
const PROMO_CODE = "ORTHODOX20";
const DISPLAY_NAME = "The Orthodox Muslim";

export default async function TheOrthodoxMuslimStatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const validKey = process.env.ORTHODOX_STATS_KEY;

  if (!validKey || params.key !== validKey) {
    return notFound();
  }

  const now = new Date();

  const [totalClicks, purchases] = await Promise.all([
    prisma.influencerClick.count({ where: { creator: CREATOR } }),
    prisma.purchase.findMany({
      where: { creator: CREATOR, status: "succeeded" },
      select: { id: true, amount: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <InfluencerStatsPage
      displayName={DISPLAY_NAME}
      promoCode={PROMO_CODE}
      totalClicks={totalClicks}
      totalPurchases={purchases.length}
      commissionCents={purchases.length * 500}
      lastUpdated={now}
      purchases={purchases}
    />
  );
}
