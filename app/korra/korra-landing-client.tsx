"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const UTM = "utm_source=tiktok&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=korra";
const SRC = "source=korra";

export default function KorraLandingClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:         "korra",
        creatorName:     "Korra",
        heroHeadline:    "You came from Korra.",
        heroSubheadline: "So you probably already know this is important.",
        discountCode:    "KORRA20",
        discountLabel:   "Your Korra discount is already applied — 20% off lifetime access.",
        checkoutUrl:     `/checkout?plan=individual-lifetime&${SRC}&promo=KORRA20&${UTM}`,
        watchFreeUrl:    "/watch-free",
        eventPrefix:     "korra_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
