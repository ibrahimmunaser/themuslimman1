"use client";

import { useStudyTimeTracker } from "@/lib/hooks/use-study-time-tracker";

interface StudyTimeTrackerProps {
  partNumber: number;
}

export function StudyTimeTracker({ partNumber }: StudyTimeTrackerProps) {
  useStudyTimeTracker({ partNumber, enabled: true });
  
  // This component doesn't render anything
  return null;
}
