"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const UTM = "utm_source=direct&utm_medium=community&utm_campaign=seerah_launch&utm_content=community";
const SRC = "source=community";

export default function CommunityFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:         "community",
        creatorName:     "Our Community",
        heroHeadline:    "A Special Offer for Our Community.",
        heroSubheadline: "You already care. This course makes it easy to act on that.",
        discountCode:    "COMMUNITY49",
        discountLabel:   "Your community discount is already applied.",
        checkoutUrl:     `/checkout?plan=individual-lifetime&${SRC}&promo=COMMUNITY49&${UTM}`,
        watchFreeUrl:    `/watch-free?${SRC}`,
        eventPrefix:     "community_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
