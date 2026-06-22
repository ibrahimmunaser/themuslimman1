"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const SRC = "source=deenresponds";
const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=deenresponds";

export default function DeenFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "deenresponds",
        creatorName: "Deen Responds",
        heroHeadline: "You came from Deen Responds.",
        price:        "$4.99/month",
        checkoutUrl:  `/checkout?plan=individual-monthly&${SRC}&${UTM}`,
        watchFreeUrl: "/watch-free",
        eventPrefix:  "deen_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
