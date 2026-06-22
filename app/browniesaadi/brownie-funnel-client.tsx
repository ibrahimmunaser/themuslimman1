"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const SRC = "source=browniesaadi";
const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=browniesaadi";

export default function BrownieFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "browniesaadi",
        creatorName: "Brownie Saadi",
        heroHeadline: "You came from Brownie Saadi.",
        price:        "$4.99/month",
        checkoutUrl:  `/checkout?plan=individual-monthly&${SRC}&${UTM}`,
        watchFreeUrl: "/watch-free",
        eventPrefix:  "brownie_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
