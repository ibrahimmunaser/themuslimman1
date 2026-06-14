import type { Metadata } from "next";
import { InfluencerLandingPage } from "@/components/influencer/influencer-landing-page";
import { prisma } from "@/lib/db";
import { MobileStickyCta } from "./mobile-sticky-cta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah — Community Offer",
  description:
    "Learn the life of the Prophet ﷺ in order. A 100-part Seerah program for Muslims and families. Exclusive community pricing.",
  robots: { index: false, follow: false },
};

const UTM = "utm_source=direct&utm_medium=community&utm_campaign=seerah_launch&utm_content=community";

export default async function CommunityPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "community" } })
    .catch(() => {});

  const INDIVIDUAL_URL = `/checkout?plan=individual-lifetime&promo=COMMUNITY49&source=community&${UTM}`;
  const FAMILY_URL     = `/checkout?plan=family-lifetime&promo=COMMUNITY99&source=community&${UTM}`;
  const MONTHLY_URL    = `/checkout?plan=individual-trial&source=community&${UTM}`;

  return (
    <>
      <InfluencerLandingPage
        creator="community"
        displayName="Community"
        sourceBadge="Community Special Offer"
        individualPromoCode="COMMUNITY49"
        individualUrl={INDIVIDUAL_URL}
        familyUrl={FAMILY_URL}
        monthlyUrl={MONTHLY_URL}
        individualPriceCents={4900}
        familyPriceCents={9900}
        regularIndividualPriceCents={7900}
        regularFamilyPriceCents={14900}
      />
      <MobileStickyCta
        href={INDIVIDUAL_URL}
        label="Community Lifetime Offer from $49"
        sublabel="One-time payment · No subscription"
      />
    </>
  );
}
