"use client";

import { SeerahCheckupClient } from "@/components/funnel/seerah-checkup-client";

const UTM = "utm_source=direct&utm_medium=community&utm_campaign=seerah_checkup&utm_content=community";
const SRC = "source=community";

export default function CommunityFunnelClient() {
  return (
    <SeerahCheckupClient
      creator="community"
      sourceBadge="Community Special"
      eventPrefix="community_"
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
