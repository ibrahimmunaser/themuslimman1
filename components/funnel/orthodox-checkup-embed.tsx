"use client";

import { SeerahCheckupClient } from "@/components/funnel/seerah-checkup-client";

const SRC = "source=theorthodoxmuslim";
const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=theorthodoxmuslim";

export function OrthodoxCheckupEmbed() {
  return (
    <SeerahCheckupClient
      embedMode
      creator="theorthodoxmuslim"
      sourceBadge="Free Seerah Checkup"
      eventPrefix="orthodox_"
      urls={{
        individualMonthly:  `/checkout?plan=individual-monthly&${SRC}&${UTM}`,
        familyMonthly:      `/checkout?plan=family-monthly&${SRC}&${UTM}`,
        individualLifetime: `/checkout?plan=individual-lifetime&${SRC}&${UTM}`,
        familyLifetime:     `/checkout?plan=family-lifetime&${SRC}&${UTM}`,
        watchFree:          "/theorthodoxmuslim#part1",
      }}
    />
  );
}
