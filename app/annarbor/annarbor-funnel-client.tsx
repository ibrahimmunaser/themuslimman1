"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const UTM = "utm_source=direct&utm_medium=promo&utm_campaign=seerah_launch&utm_content=annarbor";
const SRC = "source=annarbor";

export default function AnnArborFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "annarbor",
        creatorName: "Ann Arbor Students",
        heroHeadline: "A Special Offer for Ann Arbor Students.",
        discountLabel: "Your Ann Arbor student discount is already applied.",
        discountCode: "ANNARBOR29",
        price:        "$29 one-time",
        checkoutUrl:  `/checkout?plan=individual-lifetime&${SRC}&promo=ANNARBOR29&${UTM}`,
        watchFreeUrl: `/watch-free?${SRC}`,
        eventPrefix:  "annarbor_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
