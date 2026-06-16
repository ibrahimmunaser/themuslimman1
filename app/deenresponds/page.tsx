import type { Metadata } from "next";
import { InfluencerLandingPage } from "@/components/influencer/influencer-landing-page";
import { generateSignedR2Url, VIDEO_URL_EXPIRY } from "@/lib/r2";
import { prisma } from "@/lib/db";
import { MobileStickyCta } from "./mobile-sticky-cta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah — Deen Responds",
  description:
    "Learn the life of the Prophet ﷺ in order. 100 lessons, video, audio, quizzes, and more. As recommended by Deen Responds.",
  robots: { index: false, follow: false },
};

const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=deenresponds";
const SPONSOR_VIDEO_KEY = "Deen/deenrespondslandingpage.mp4";

export default async function DeenRespondsPage() {
  const [videoUrl] = await Promise.all([
    generateSignedR2Url(SPONSOR_VIDEO_KEY, VIDEO_URL_EXPIRY),
    prisma.influencerClick
      .create({ data: { id: crypto.randomUUID(), creator: "deenresponds" } })
      .catch(() => {}),
  ]);

  const INDIVIDUAL_URL         = `/checkout?plan=individual-lifetime&source=deenresponds&${UTM}`;
  const FAMILY_URL             = `/checkout?plan=family-lifetime&source=deenresponds&${UTM}`;
  const INDIVIDUAL_MONTHLY_URL = `/checkout?plan=individual-monthly&source=deenresponds&${UTM}`;
  const FAMILY_MONTHLY_URL     = `/checkout?plan=family-monthly&source=deenresponds&${UTM}`;

  return (
    <>
      <InfluencerLandingPage
        creator="deenresponds"
        displayName="Deen Responds"
        sourceBadge="As seen on Deen Responds"
        individualUrl={INDIVIDUAL_URL}
        familyUrl={FAMILY_URL}
        individualPriceCents={4900}
        familyPriceCents={7900}
        sponsorVideoUrl={videoUrl}
        videoSectionLabel="Why Deen Responds recommended this"
        videoAspectClass="aspect-video"
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
