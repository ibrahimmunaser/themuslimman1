import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import CommunityFunnelClient from "./community-funnel-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah Course — Community Special",
  description:
    "A special offer for our community. Start the complete 100-part Seerah course. Watch Part 1 free — no signup required. Discount already applied.",
  robots: { index: false, follow: false },
};

export default async function CommunityPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "community" } })
    .catch(() => {});

  return <CommunityFunnelClient />;
}
