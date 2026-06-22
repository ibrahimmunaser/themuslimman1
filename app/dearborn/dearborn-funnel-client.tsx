"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const UTM = "utm_source=direct&utm_medium=community&utm_campaign=seerah_launch&utm_content=dearborn";
const SRC = "source=dearborn";

export default function DearbornFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:         "dearborn",
        creatorName:     "Dearborn Community",
        heroHeadline:    "A Special Offer for the Dearborn Community.",
        heroSubheadline: "You already care. This course makes it easy to act on that.",
        discountCode:    "DEARBORN20",
        discountLabel:   "Your Dearborn community discount is already applied.",
        checkoutUrl:     `/checkout?plan=individual-lifetime&${SRC}&promo=DEARBORN20&${UTM}`,
        watchFreeUrl:    `/watch-free?${SRC}`,
        eventPrefix:     "dearborn_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
