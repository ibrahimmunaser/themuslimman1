import type { Metadata } from "next";
import Link from "next/link";
import { InfluencerLandingPage } from "@/components/influencer/influencer-landing-page";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah — The Orthodox Muslim",
  description:
    "Learn the life of the Prophet ﷺ in order. 100 lessons, video, audio, quizzes, and more. As recommended by The Orthodox Muslim.",
  robots: { index: false, follow: false },
};

const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=theorthodoxmuslim";

export default async function TheOrthodoxMuslimPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "theorthodoxmuslim" } })
    .catch(() => {});

  const INDIVIDUAL_URL         = `/checkout?plan=individual-lifetime&source=theorthodoxmuslim&${UTM}`;
  const FAMILY_URL             = `/checkout?plan=family-lifetime&source=theorthodoxmuslim&${UTM}`;
  const INDIVIDUAL_MONTHLY_URL = `/checkout?plan=individual-monthly&source=theorthodoxmuslim&${UTM}`;
  const FAMILY_MONTHLY_URL     = `/checkout?plan=family-monthly&source=theorthodoxmuslim&${UTM}`;

  return (
    <>
      <InfluencerLandingPage
        creator="theorthodoxmuslim"
        displayName="The Orthodox Muslim"
        sourceBadge="As seen on The Orthodox Muslim"
        individualUrl={INDIVIDUAL_URL}
        familyUrl={FAMILY_URL}
        individualPriceCents={4900}
        familyPriceCents={9900}
        individualMonthlyUrl={INDIVIDUAL_MONTHLY_URL}
        familyMonthlyUrl={FAMILY_MONTHLY_URL}
      />
      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-ink/95 border-t border-gold/20 backdrop-blur-sm px-4 py-3">
        <Link
          href={INDIVIDUAL_MONTHLY_URL}
          className="flex flex-col items-center justify-center w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-lg shadow-gold/20"
        >
          <span>Start for $4.99/month</span>
          <span className="text-[10px] font-normal mt-0.5 opacity-70">Cancel anytime · Instant access</span>
        </Link>
      </div>
    </>
  );
}
