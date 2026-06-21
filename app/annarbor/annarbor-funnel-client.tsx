"use client";

import { SeerahCheckupClient } from "@/components/funnel/seerah-checkup-client";

const UTM = "utm_source=direct&utm_medium=promo&utm_campaign=seerah_checkup&utm_content=annarbor";
const SRC = "source=annarbor";

export default function AnnArborFunnelClient() {
  return (
    <SeerahCheckupClient
      creator="annarbor"
      sourceBadge="For Ann Arbor Students"
      eventPrefix="annarbor_"
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
