"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=theorthodoxmuslim";
const SRC = "source=theorthodoxmuslim";

export default function OrthodoxFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "theorthodoxmuslim",
        creatorName: "The Orthodox Muslim",
        heroHeadline: "You came from The Orthodox Muslim.",
        discountLabel: "The Orthodox Muslim discount is already applied.",
        price:        "$4.99/month",
        checkoutUrl:  `/checkout?plan=individual-monthly&${SRC}&${UTM}`,
        watchFreeUrl: "/watch-free",
        eventPrefix:  "orthodox_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
