import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";

const SRC = "source=community";
const UTM = "utm_source=direct&utm_medium=community&utm_campaign=seerah_launch&utm_content=community";
const CHECKOUT = `/checkout?plan=individual-lifetime&${SRC}&${UTM}`;

export default function CommunityFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "community",
        creatorName: "Our Community",
        heroHeadline: "A Special Offer for Our Community.",
        price:        "$49 one-time",
        checkoutUrl:  CHECKOUT,
        watchFreeUrl: `/watch-free?${SRC}`,
        eventPrefix:  "community_",
        checkoutButtonLabel: "Start Now",
      }}
      part1Preview={
        <Part1FullPreview
          checkoutHref={CHECKOUT}
          ctaLabel="Get Lifetime Access — $49"
        />
      }
    />
  );
}
