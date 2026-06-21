"use client";

import { SeerahCheckupClient } from "@/components/funnel/seerah-checkup-client";

const UTM = "utm_source=direct&utm_medium=community&utm_campaign=seerah_checkup&utm_content=dearborn";
const SRC = "source=dearborn";

export default function DearbornFunnelClient() {
  return (
    <SeerahCheckupClient
      creator="dearborn"
      sourceBadge="For Dearborn Community"
      eventPrefix="dearborn_"
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
