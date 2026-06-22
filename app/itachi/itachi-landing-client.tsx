"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const UTM = "utm_source=tiktok&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=itachi";
const SRC = "source=itachi";

export default function ItachiLandingClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:         "itachi",
        creatorName:     "Itachi",
        heroHeadline:    "You came from Itachi.",
        heroSubheadline: "So you probably already know this is important.",
        discountCode:    "ITACHI20",
        discountLabel:   "Your Itachi discount is already applied — 20% off lifetime access.",
        checkoutUrl:     `/checkout?plan=individual-lifetime&${SRC}&promo=ITACHI20&${UTM}`,
        watchFreeUrl:    "/watch-free",
        eventPrefix:     "itachi_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
