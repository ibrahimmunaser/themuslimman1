import type { Metadata } from "next";
import { InfluencerLandingPage } from "@/components/influencer/influencer-landing-page";
import { prisma } from "@/lib/db";
import { MobileStickyCta } from "./mobile-sticky-cta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah — Community",
  description:
    "Learn the life of the Prophet ﷺ in order. A 100-part Seerah program for Muslims and families.",
  robots: { index: false, follow: false },
};

const UTM = "utm_source=direct&utm_medium=community&utm_campaign=seerah_launch&utm_content=community";

export default async function CommunityPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "community" } })
    .catch(() => {});

  const INDIVIDUAL_URL         = `/checkout?plan=individual-lifetime&source=community&${UTM}`;
  const FAMILY_URL             = `/checkout?plan=family-lifetime&source=community&${UTM}`;
  const INDIVIDUAL_MONTHLY_URL = `/checkout?plan=individual-monthly&source=community&${UTM}`;
  const FAMILY_MONTHLY_URL     = `/checkout?plan=family-monthly&source=community&${UTM}`;

  return (
    <>
      <InfluencerLandingPage
        creator="community"
        displayName="Community"
        sourceBadge="Community Special Offer"
        individualUrl={INDIVIDUAL_URL}
        familyUrl={FAMILY_URL}
        individualPriceCents={4900}
        familyPriceCents={9900}
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
