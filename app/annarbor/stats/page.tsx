import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LocationStatsPage } from "@/components/location/location-stats-page";

export const dynamic = "force-dynamic";

const LOCATION = "annarbor";
const PROMO_CODE = "ANNARBOR20";
const DISPLAY_NAME = "Ann Arbor";

export default async function AnnArborStatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const validKey = process.env.ANNARBOR_STATS_KEY;

  if (!validKey || params.key !== validKey) {
    return notFound();
  }

  const now = new Date();

  const [totalClicks, purchases] = await Promise.all([
    prisma.influencerClick.count({ where: { creator: LOCATION } }),
    prisma.purchase.findMany({
      where: { creator: LOCATION, status: "succeeded" },
      select: { id: true, amount: true, createdAt: true, user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);

  return (
    <LocationStatsPage
      displayName={DISPLAY_NAME}
      promoCode={PROMO_CODE}
      totalClicks={totalClicks}
      totalPurchases={purchases.length}
      totalRevenueCents={totalRevenue}
      lastUpdated={now}
      purchases={purchases.map((p) => ({ ...p, userEmail: p.user.email }))}
    />
  );
}
