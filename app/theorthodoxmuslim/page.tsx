import type { Metadata } from "next";
import Link from "next/link";
import { InfluencerLandingPage } from "@/components/influencer/influencer-landing-page";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah — The Orthodox Muslim Exclusive Offer",
  description:
    "Learn the life of the Prophet ﷺ in order. 100 lessons, video, audio, quizzes, and more. Exclusive pricing for The Orthodox Muslim viewers.",
  robots: { index: false, follow: false },
};

const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=theorthodoxmuslim";

export default async function TheOrthodoxMuslimPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "theorthodoxmuslim" } })
    .catch(() => {});

  const INDIVIDUAL_URL = `/checkout?plan=individual-lifetime&promo=ORTHODOX59&source=theorthodoxmuslim&${UTM}`;
  const FAMILY_URL     = `/checkout?plan=family-lifetime&promo=ORTHODOX119&source=theorthodoxmuslim&${UTM}`;
  const MONTHLY_URL    = `/checkout?plan=individual-trial&source=theorthodoxmuslim&${UTM}`;

  return (
    <>
      <InfluencerLandingPage
        creator="theorthodoxmuslim"
        displayName="The Orthodox Muslim"
        sourceBadge="As seen on The Orthodox Muslim"
        individualPromoCode="ORTHODOX59"
        individualUrl={INDIVIDUAL_URL}
        familyUrl={FAMILY_URL}
        monthlyUrl={MONTHLY_URL}
        individualPriceCents={5900}
        familyPriceCents={11900}
        regularIndividualPriceCents={7900}
        regularFamilyPriceCents={14900}
      />
      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-ink/95 border-t border-gold/20 backdrop-blur-sm px-4 py-3">
        <Link
          href={INDIVIDUAL_URL}
          className="flex flex-col items-center justify-center w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-lg shadow-gold/20"
        >
          <span>Orthodox Muslim Lifetime Offer from $59</span>
          <span className="text-[10px] font-normal mt-0.5 opacity-70">One-time payment · No subscription</span>
        </Link>
      </div>
    </>
  );
}
