import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import OrthodoxFunnelClient from "./orthodox-funnel-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah Course — The Orthodox Muslim",
  description:
    "Recommended by The Orthodox Muslim. Start the complete 100-part Seerah course. Watch Part 1 free — no signup required. Discount already applied.",
  robots: { index: false, follow: false },
};

export default async function TheOrthodoxMuslimPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "theorthodoxmuslim" } })
    .catch(() => {});

  return <OrthodoxFunnelClient />;
}
