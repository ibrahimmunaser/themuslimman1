import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import AnnArborFunnelClient from "./annarbor-funnel-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah Course — Ann Arbor Students",
  description:
    "A special offer for Ann Arbor students. Start the complete 100-part Seerah course. Watch Part 1 free — no signup required. Discount already applied.",
  robots: { index: false, follow: false },
};

export default async function AnnArborPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "annarbor" } })
    .catch(() => {});

  return <AnnArborFunnelClient />;
}
