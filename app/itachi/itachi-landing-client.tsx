import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";

const SRC      = "source=itachi";
const UTM      = "utm_source=tiktok&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=itachi";
const CHECKOUT = `/checkout?plan=individual-monthly&${SRC}&${UTM}`;

export default function ItachiLandingClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:             "itachi",
        creatorName:         "Itachi",
        heroHeadline:        "You came from Itachi.",
        price:               "$4.99/month",
        checkoutUrl:         CHECKOUT,
        watchFreeUrl:        "/watch-free",
        eventPrefix:         "itachi_",
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
