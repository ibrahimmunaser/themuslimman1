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
        individualMonthly:  `/checkout?plan=individual-monthly&${SRC}`,
        familyMonthly:      `/checkout?plan=family-monthly&${SRC}`,
        individualLifetime: `/checkout?plan=individual-lifetime&${SRC}`,
        familyLifetime:     `/checkout?plan=family-lifetime&${SRC}`,
        watchFree:          "/watch-free",
      }}
    />
  );
}
