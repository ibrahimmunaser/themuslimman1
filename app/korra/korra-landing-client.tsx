"use client";

import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";

const SRC = "source=korra";
const UTM = "utm_source=tiktok&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=korra";

export default function KorraLandingClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "korra",
        creatorName: "Korra",
        heroHeadline: "You came from Korra.",
        price:        "$4.99/month",
        checkoutUrl:  `/checkout?plan=individual-monthly&${SRC}&${UTM}`,
        watchFreeUrl: "/watch-free",
        eventPrefix:  "korra_",
        checkoutButtonLabel: "Start Now",
      }}
    />
  );
}
