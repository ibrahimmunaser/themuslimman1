"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const SRC = "source=dearborn";
const UTM = "utm_source=direct&utm_medium=community&utm_campaign=seerah_launch&utm_content=dearborn";

export default function DearbornFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "dearborn",
        creatorName: "Dearborn Community",
        heroHeadline: "A Special Offer for the Dearborn Community.",
        price:        "$4.99/month",
        checkoutUrl:  `/checkout?plan=individual-monthly&${SRC}&${UTM}`,
        watchFreeUrl: `/watch-free?${SRC}`,
        eventPrefix:  "dearborn_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
