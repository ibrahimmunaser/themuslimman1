import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import AnnArborFunnelClient from "./annarbor-funnel-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seerah Checkup — Ann Arbor Students",
  description:
    "Do you know the Prophet's ﷺ life in order — or only scattered stories? Take the free 2-minute Seerah Checkup and find out.",
  robots: { index: false, follow: false },
};

export default async function AnnArborPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "annarbor" } })
    .catch(() => {});

  return <AnnArborFunnelClient />;
}
