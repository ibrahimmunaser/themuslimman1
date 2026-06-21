"use client";

import { SeerahCheckupClient } from "@/components/funnel/seerah-checkup-client";

const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_checkup&utm_content=deenresponds";
const SRC = "source=deenresponds";

export default function DeenFunnelClient() {
  return (
    <SeerahCheckupClient
      creator="deenresponds"
      sourceBadge="For Deen Responds viewers"
      eventPrefix="deen_"
      urls={{
        individualMonthly:  `/checkout?plan=individual-monthly&${SRC}&${UTM}`,
        familyMonthly:      `/checkout?plan=family-monthly&${SRC}&${UTM}`,
        individualLifetime: `/checkout?plan=individual-lifetime&${SRC}&${UTM}`,
        familyLifetime:     `/checkout?plan=family-lifetime&${SRC}&${UTM}`,
        watchFree:          "/watch-free",
      }}
    />
  );
}
