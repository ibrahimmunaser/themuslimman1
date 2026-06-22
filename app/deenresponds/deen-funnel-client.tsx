"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=deenresponds";
const SRC = "source=deenresponds";

export default function DeenFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:         "deenresponds",
        creatorName:     "Deen Responds",
        heroHeadline:    "You came from Deen Responds.",
        heroSubheadline: "So you probably already know this is important.",
        discountCode:    "DEEN59",
        discountLabel:   "The Deen Responds discount is already applied.",
        checkoutUrl:     `/checkout?plan=individual-lifetime&${SRC}&promo=DEEN59&${UTM}`,
        watchFreeUrl:    "/watch-free",
        eventPrefix:     "deen_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
