import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";

const SRC      = "source=korra";
const UTM      = "utm_source=tiktok&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=korra";
const CHECKOUT = `/checkout?plan=individual-monthly&${SRC}&${UTM}`;

export default function KorraLandingClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:             "korra",
        creatorName:         "Korra",
        heroHeadline:        "You came from Korra.",
        price:               "$4.99/month",
        checkoutUrl:         CHECKOUT,
        watchFreeUrl:        "/watch-free",
        eventPrefix:         "korra_",
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
