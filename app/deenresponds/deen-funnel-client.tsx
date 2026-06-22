import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";

const SRC = "source=deenresponds";
const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=deenresponds";
const CHECKOUT = `/checkout?plan=individual-monthly&${SRC}&${UTM}`;

export default function DeenFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "deenresponds",
        creatorName: "Deen Responds",
        heroHeadline: "You came from Deen Responds.",
        price:        "$4.99/month",
        checkoutUrl:  CHECKOUT,
        watchFreeUrl: "/watch-free",
        eventPrefix:  "deen_",
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
