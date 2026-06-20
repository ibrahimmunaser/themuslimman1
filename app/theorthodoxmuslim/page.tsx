import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import OrthodoxFunnelClient from "./orthodox-funnel-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah — The Orthodox Muslim",
  description:
    "Do you know the Prophet's ﷺ life in order — or only scattered stories? Take the free 2-minute Seerah Checkup and find out.",
  robots: { index: false, follow: false },
};

export default async function TheOrthodoxMuslimPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "theorthodoxmuslim" } })
    .catch(() => {});

  return <OrthodoxFunnelClient />;
}
