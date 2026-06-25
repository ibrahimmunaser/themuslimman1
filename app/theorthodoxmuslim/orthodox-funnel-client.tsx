import { InfluencerDirectLanding } from "@/components/funnel/influencer-direct-landing";
import { OrthodoxCheckupEmbed } from "@/components/funnel/orthodox-checkup-embed";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";

const SRC = "source=theorthodoxmuslim";
const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=theorthodoxmuslim";
const CHECKOUT = `/checkout?plan=individual-monthly&${SRC}&${UTM}`;

export default function OrthodoxFunnelClient() {
  return (
    <InfluencerDirectLanding
      config={{
        creator:     "theorthodoxmuslim",
        creatorName: "The Orthodox Muslim",
        heroHeadline: "Learn the life of the Prophet ﷺ in order — start with Part 1 free.",
        price:        "$4.99/month",
        checkoutUrl:  CHECKOUT,
        watchFreeUrl: "/watch-free",
        eventPrefix:  "orthodox_",
        checkoutButtonLabel: "Continue for $4.99/month",
      }}
      part1Preview={
        <Part1FullPreview
          checkoutHref={CHECKOUT}
          ctaLabel="Continue the Full Course — $4.99/month"
        />
      }
      afterPart1Preview={<OrthodoxCheckupEmbed />}
    />
  );
}
