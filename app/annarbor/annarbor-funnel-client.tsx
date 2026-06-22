import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";

const SRC = "source=annarbor";
const UTM = "utm_source=direct&utm_medium=promo&utm_campaign=seerah_launch&utm_content=annarbor";
const CHECKOUT = `/checkout?plan=individual-monthly&${SRC}&${UTM}`;

export default function AnnArborFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "annarbor",
        creatorName: "Ann Arbor Students",
        heroHeadline: "A Special Offer for Ann Arbor Students.",
        price:        "$4.99/month",
        checkoutUrl:  CHECKOUT,
        watchFreeUrl: `/watch-free?${SRC}`,
        eventPrefix:  "annarbor_",
        checkoutButtonLabel: "Start Now",
      }}
      part1Preview={
        <Part1FullPreview
          checkoutHref={CHECKOUT}
          ctaLabel="Start the Full Course — $4.99/month"
        />
      }
    />
  );
}
