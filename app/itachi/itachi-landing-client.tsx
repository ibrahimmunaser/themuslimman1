"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const SRC = "source=itachi";
const UTM = "utm_source=tiktok&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=itachi";

export default function ItachiLandingClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "itachi",
        creatorName: "Itachi",
        heroHeadline: "You came from Itachi.",
        price:        "$4.99/month",
        checkoutUrl:  `/checkout?plan=individual-monthly&${SRC}&${UTM}`,
        watchFreeUrl: "/watch-free",
        eventPrefix:  "itachi_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
