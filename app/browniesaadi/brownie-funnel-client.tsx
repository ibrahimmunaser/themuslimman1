"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=browniesaadi";
const SRC = "source=browniesaadi";

export default function BrownieFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:         "browniesaadi",
        creatorName:     "Brownie Saadi",
        heroHeadline:    "You came from Brownie Saadi.",
        heroSubheadline: "So you probably already know this is important.",
        discountCode:    "BROWNIE59",
        discountLabel:   "The Brownie Saadi discount is already applied.",
        checkoutUrl:     `/checkout?plan=individual-lifetime&${SRC}&promo=BROWNIE59&${UTM}`,
        watchFreeUrl:    "/watch-free",
        eventPrefix:     "brownie_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
