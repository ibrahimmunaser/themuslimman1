import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import ItachiLandingClient from "./itachi-landing-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah Course — Itachi",
  description:
    "Start the complete 100-part Seerah course recommended by Itachi. Watch Part 1 free — no signup required.",
  robots: { index: false, follow: false },
};

export default async function ItachiPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "itachi" } })
    .catch(() => {});

  return <ItachiLandingClient />;
}
