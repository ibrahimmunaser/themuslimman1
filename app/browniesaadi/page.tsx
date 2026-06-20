import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import BrownieFunnelClient from "./brownie-funnel-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah — Brownie Saadi",
  description:
    "Do you know the Prophet's ﷺ life in order — or only scattered stories? Take the free 2-minute Seerah Checkup and find out. As recommended by Brownie Saadi.",
  robots: { index: false, follow: false },
};

export default async function BrowniesaadiPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "browniesaadi" } })
    .catch(() => {});

  return <BrownieFunnelClient />;
}
