"use client";

/**
 * PageViewTracker — generic drop-in analytics component for server-rendered
 * app pages (the signed-in learning app, not the marketing funnel).
 *
 * Fires a single `trackEvent(eventName, properties)` call on mount via the
 * same centralized pipeline used by the marketing FunnelTracker, so in-app
 * engagement events land in the same events table and can be correlated
 * with acquisition/funnel data (e.g. "which creators' users actually use
 * flashcards", "where in the course do paid users stop coming back").
 *
 * Usage: drop <PageViewTracker eventName="resources_viewed" properties={{...}} />
 * anywhere inside a Server Component's returned JSX.
 */

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

export interface PageViewTrackerProps {
  eventName: string;
  properties?: Record<string, unknown>;
  /** Allow firing again if properties identity changes (e.g. partNumber nav). Default: fire once per mount. */
  allowDuplicates?: boolean;
}

export function PageViewTracker({ eventName, properties = {}, allowDuplicates = true }: PageViewTrackerProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackEvent(eventName, properties, { allowDuplicates });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
