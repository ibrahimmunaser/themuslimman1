import type { Metadata } from "next";
import { InfluencerLandingPage } from "@/components/influencer/influencer-landing-page";
import { generateSignedR2Url, VIDEO_URL_EXPIRY } from "@/lib/r2";
import { prisma } from "@/lib/db";
import { MobileStickyCta } from "@/app/deenresponds/mobile-sticky-cta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah — Brownie Saadi",
  description:
    "Learn the life of the Prophet ﷺ in order. 100 lessons, video, audio, quizzes, and more. As recommended by Brownie Saadi.",
  robots: { index: false, follow: false },
};

const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=browniesaadi";
const SPONSOR_VIDEO_KEY = "Brownie/Brownie.mp4";

export default async function BrowniesaadiPage() {
  const [videoUrl] = await Promise.all([
    generateSignedR2Url(SPONSOR_VIDEO_KEY, VIDEO_URL_EXPIRY),
    prisma.influencerClick
      .create({ data: { id: crypto.randomUUID(), creator: "browniesaadi" } })
      .catch(() => {}),
  ]);

  const INDIVIDUAL_URL         = `/checkout?plan=individual-lifetime&source=browniesaadi&${UTM}`;
  const FAMILY_URL             = `/checkout?plan=family-lifetime&source=browniesaadi&${UTM}`;
  const INDIVIDUAL_MONTHLY_URL = `/checkout?plan=individual-monthly&source=browniesaadi&${UTM}`;
  const FAMILY_MONTHLY_URL     = `/checkout?plan=family-monthly&source=browniesaadi&${UTM}`;

  return (
    <>
      <InfluencerLandingPage
        creator="browniesaadi"
        displayName="Brownie Saadi"
        sourceBadge="Brownie Saadi Special"
        individualUrl={INDIVIDUAL_URL}
        familyUrl={FAMILY_URL}
        individualPriceCents={4900}
        familyPriceCents={7900}
        sponsorVideoUrl={videoUrl}
        videoSectionLabel="Why Brownie Saadi recommended this"
        individualMonthlyUrl={INDIVIDUAL_MONTHLY_URL}
        familyMonthlyUrl={FAMILY_MONTHLY_URL}
      />
      <MobileStickyCta
        href={INDIVIDUAL_MONTHLY_URL}
        label="Start for $4.99/month"
        sublabel="Cancel anytime · Instant access"
      />
    </>
  );
}
