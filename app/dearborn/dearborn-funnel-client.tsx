"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const UTM = "utm_source=direct&utm_medium=community&utm_campaign=seerah_launch&utm_content=dearborn";
const SRC = "source=dearborn";

export default function DearbornFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "dearborn",
        creatorName: "Dearborn Community",
        heroHeadline: "A Special Offer for the Dearborn Community.",
        discountLabel: "Your Dearborn community discount is already applied.",
        discountCode: "DEARBORN20",
        checkoutUrl:  `/checkout?plan=individual-lifetime&${SRC}&promo=DEARBORN20&${UTM}`,
        watchFreeUrl: `/watch-free?${SRC}`,
        eventPrefix:  "dearborn_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
