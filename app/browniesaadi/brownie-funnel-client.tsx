import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";

const SRC = "source=browniesaadi";
const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=browniesaadi";
const CHECKOUT = `/checkout?plan=individual-monthly&${SRC}&${UTM}`;

export default function BrownieFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "browniesaadi",
        creatorName: "Brownie Saadi",
        heroHeadline: "You came from Brownie Saadi.",
        price:        "$4.99/month",
        checkoutUrl:  CHECKOUT,
        watchFreeUrl: "/watch-free",
        eventPrefix:  "brownie_",
        checkoutButtonLabel: "Start Now",
      }}
      part1Preview={
        <Part1FullPreview
          checkoutHref={CHECKOUT}
          ctaLabel="Start the Full Course — $4.99/month"
        />
      }
    />
  );
}
