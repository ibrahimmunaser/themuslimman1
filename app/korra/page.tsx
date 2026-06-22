import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import KorraLandingClient from "./korra-landing-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah Course — Korra",
  description:
    "Start the complete 100-part Seerah course recommended by Korra. Watch Part 1 free — no signup required.",
  robots: { index: false, follow: false },
};

export default async function KorraPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "korra" } })
    .catch(() => {});

  return <KorraLandingClient />;
}
