"use client";

import { SeerahCheckupClient } from "@/components/funnel/seerah-checkup-client";

const SRC = "source=homepage";

export default function CheckupFunnelClient() {
  return (
    <SeerahCheckupClient
      creator="homepage"
      sourceBadge="Free Seerah Checkup"
      eventPrefix="homepage_"
      urls={{
        individualMonthly:  `/checkout?plan=individual-lifetime&${SRC}`,
        familyMonthly:      `/checkout?plan=individual-lifetime&${SRC}`,
        individualLifetime: `/checkout?plan=individual-lifetime&${SRC}`,
        familyLifetime:     `/checkout?plan=individual-lifetime&${SRC}`,
        watchFree:          "/watch-free",
      }}
    />
  );
}
