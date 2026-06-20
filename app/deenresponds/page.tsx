import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import DeenFunnelClient from "./deen-funnel-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah — Deen Responds",
  description:
    "Do you know the Prophet's ﷺ life in order — or only scattered stories? Take the free 2-minute Seerah Checkup and find out. As recommended by Deen Responds.",
  robots: { index: false, follow: false },
};

export default async function DeenRespondsPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "deenresponds" } })
    .catch(() => {});

  return <DeenFunnelClient />;
}
