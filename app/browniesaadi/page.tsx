import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import BrownieFunnelClient from "./brownie-funnel-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah Course — Brownie Saadi",
  description:
    "Recommended by Brownie Saadi. Start the complete 100-part Seerah course. Watch Part 1 free — no signup required. Discount already applied.",
  robots: { index: false, follow: false },
};

export default async function BrowniesaadiPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "browniesaadi" } })
    .catch(() => {});

  return <BrownieFunnelClient />;
}
