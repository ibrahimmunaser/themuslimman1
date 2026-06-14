import type { Metadata } from "next";
import { InfluencerLandingPage } from "@/components/influencer/influencer-landing-page";
import { generateSignedR2Url, VIDEO_URL_EXPIRY } from "@/lib/r2";
import { prisma } from "@/lib/db";
import { MobileStickyCta } from "@/app/deenresponds/mobile-sticky-cta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah — Browniesaadi Exclusive Offer",
  description:
    "Learn the life of the Prophet ﷺ in order. 100 lessons, video, audio, quizzes, and more. Exclusive pricing for Browniesaadi viewers.",
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

  const INDIVIDUAL_URL = `/checkout?plan=individual-lifetime&promo=BROWNIE59&source=browniesaadi&${UTM}`;
  const FAMILY_URL     = `/checkout?plan=family-lifetime&promo=BROWNIE119&source=browniesaadi&${UTM}`;

  return (
    <>
      <InfluencerLandingPage
        creator="browniesaadi"
        displayName="Brownie Saadi"
        sourceBadge="Brownie Saadi Special"
        individualPromoCode="BROWNIE59"
        individualUrl={INDIVIDUAL_URL}
        familyUrl={FAMILY_URL}
        individualPriceCents={5900}
        familyPriceCents={11900}
        regularIndividualPriceCents={7900}
        regularFamilyPriceCents={14900}
        sponsorVideoUrl={videoUrl}
        videoSectionLabel="Why Brownie Saadi recommended this"
        showPricingCards={false}
      />
      <MobileStickyCta
        href={INDIVIDUAL_URL}
        label="Brownie Saadi Lifetime Offer from $59"
        sublabel="One-time payment · No subscription"
      />
    </>
  );
}

