import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import DearbornFunnelClient from "./dearborn-funnel-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah Course — Dearborn Community",
  description:
    "A special offer for the Dearborn community. Start the complete 100-part Seerah course. Watch Part 1 free — no signup required. Discount already applied.",
  robots: { index: false, follow: false },
};

export default async function DearbornPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "dearborn" } })
    .catch(() => {});

  return <DearbornFunnelClient />;
}
