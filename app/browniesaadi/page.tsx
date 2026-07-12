import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCachedCurrentUser } from "@/lib/auth-cache";
import { getInfluencerConfig } from "@/lib/influencer-configs";
import { getInfluencerPageData } from "@/lib/influencer-page-data";
import InfluencerQuickCheckout from "@/components/influencer/influencer-quick-checkout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah Course — Brownie Saadi",
  description:
    "Recommended by Brownie Saadi. Start the complete 100-part Seerah course. Watch Part 1 free — no signup required.",
  robots: { index: false, follow: false },
};

export default async function BrowniesaadiPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "browniesaadi" } })
    .catch(() => {});

  const [user, pageData] = await Promise.all([
    getCachedCurrentUser(),
    getInfluencerPageData(),
  ]);

  return (
    <InfluencerQuickCheckout
      config={getInfluencerConfig("browniesaadi")!}
      part1={pageData.part}
      part1AssetUrls={pageData.initialAssetUrls}
      isAuthenticated={!!user}
      userEmail={user?.email ?? ""}
    />
  );
}
