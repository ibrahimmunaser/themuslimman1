import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import DeenFunnelClient from "./deen-funnel-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah Course — Deen Responds",
  description:
    "Recommended by Deen Responds. Start the complete 100-part Seerah course. Watch Part 1 free — no signup required. Discount already applied.",
  robots: { index: false, follow: false },
};

export default async function DeenRespondsPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "deenresponds" } })
    .catch(() => {});

  return <DeenFunnelClient />;
}
