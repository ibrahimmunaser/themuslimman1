import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import CheckupFunnelClient from "./checkup-funnel-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free Seerah Checkup — How Well Do You Know the Prophet's ﷺ Life?",
  description:
    "Do you know the Prophet's ﷺ life in order — or only scattered stories? Take the free 2-minute Seerah Checkup and find out.",
};

export default async function CheckupPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "homepage" } })
    .catch(() => {});

  return <CheckupFunnelClient />;
}
