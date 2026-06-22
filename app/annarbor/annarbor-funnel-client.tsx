"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const SRC = "source=annarbor";
const UTM = "utm_source=direct&utm_medium=promo&utm_campaign=seerah_launch&utm_content=annarbor";

export default function AnnArborFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "annarbor",
        creatorName: "Ann Arbor Students",
        heroHeadline: "A Special Offer for Ann Arbor Students.",
        price:        "$4.99/month",
        checkoutUrl:  `/checkout?plan=individual-monthly&${SRC}&${UTM}`,
        watchFreeUrl: `/watch-free?${SRC}`,
        eventPrefix:  "annarbor_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
