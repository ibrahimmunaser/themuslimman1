"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const UTM = "utm_source=direct&utm_medium=promo&utm_campaign=seerah_launch&utm_content=annarbor";
const SRC = "source=annarbor";

export default function AnnArborFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:         "annarbor",
        creatorName:     "Ann Arbor Students",
        heroHeadline:    "A Special Offer for Ann Arbor Students.",
        heroSubheadline: "You already care. This course makes it easy to act on that.",
        discountCode:    "ANNARBOR29",
        discountLabel:   "Your Ann Arbor student discount is already applied.",
        checkoutUrl:     `/checkout?plan=individual-lifetime&${SRC}&promo=ANNARBOR29&${UTM}`,
        watchFreeUrl:    `/watch-free?${SRC}`,
        eventPrefix:     "annarbor_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
