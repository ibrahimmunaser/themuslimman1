"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const SRC = "source=community";
const UTM = "utm_source=direct&utm_medium=community&utm_campaign=seerah_launch&utm_content=community";

export default function CommunityFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "community",
        creatorName: "Our Community",
        heroHeadline: "A Special Offer for Our Community.",
        price:        "$4.99/month",
        checkoutUrl:  `/checkout?plan=individual-monthly&${SRC}&${UTM}`,
        watchFreeUrl: `/watch-free?${SRC}`,
        eventPrefix:  "community_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
