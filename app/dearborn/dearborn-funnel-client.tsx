import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";

const SRC = "source=dearborn";
const UTM = "utm_source=direct&utm_medium=community&utm_campaign=seerah_launch&utm_content=dearborn";
const CHECKOUT = `/checkout?plan=individual-monthly&${SRC}&${UTM}`;

export default function DearbornFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "dearborn",
        creatorName: "Dearborn Community",
        heroHeadline: "A Special Offer for the Dearborn Community.",
        price:        "$4.99/month",
        checkoutUrl:  CHECKOUT,
        watchFreeUrl: `/watch-free?${SRC}`,
        eventPrefix:  "dearborn_",
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
