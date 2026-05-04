"use client";

import { useEffect, useRef } from "react";

interface UseStudyTimeTrackerOptions {
  partNumber: number;
  enabled?: boolean;
}

const IDLE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const SAVE_INTERVAL_MS = 60 * 1000; // Save every 60 seconds

export function useStudyTimeTracker({ partNumber, enabled = true }: UseStudyTimeTrackerOptions) {
  const accumulatedSecondsRef = useRef(0);
  const lastActiveTimeRef = useRef(Date.now());
  const isTrackingRef = useRef(false);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save accumulated time to server
  const saveTime = async () => {
    if (accumulatedSecondsRef.current > 0) {
      const secondsToSave = accumulatedSecondsRef.current;
      accumulatedSecondsRef.current = 0;

      try {
        await fetch("/api/student/track-study-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partNumber,
            secondsToAdd: secondsToSave,
          }),
        });
      } catch (error) {
        console.error("Failed to save study time:", error);
        // Add back the seconds if save failed
        accumulatedSecondsRef.current += secondsToSave;
      }
    }
  };

  // Start tracking
  const startTracking = () => {
    if (isTrackingRef.current || !enabled) return;
    
    isTrackingRef.current = true;
    lastActiveTimeRef.current = Date.now();

    // Periodic save interval
    saveIntervalRef.current = setInterval(() => {
      if (isTrackingRef.current) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastActiveTimeRef.current) / 1000);
        
        if (elapsedSeconds > 0 && elapsedSeconds <= 120) { // Only count if not idle
          accumulatedSecondsRef.current += elapsedSeconds;
        }
        
        lastActiveTimeRef.current = now;
        saveTime();
      }
    }, SAVE_INTERVAL_MS);

    // Idle check interval
    idleCheckIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActive = now - lastActiveTimeRef.current;
      
      if (timeSinceActive > IDLE_TIMEOUT_MS && isTrackingRef.current) {
        // User is idle, stop tracking
        stopTracking();
      }
    }, 30 * 1000); // Check every 30 seconds
  };

  // Stop tracking
  const stopTracking = () => {
    if (!isTrackingRef.current) return;
    
    isTrackingRef.current = false;

    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }

    if (idleCheckIntervalRef.current) {
      clearInterval(idleCheckIntervalRef.current);
      idleCheckIntervalRef.current = null;
    }

    // Save any remaining time
    saveTime();
  };

  // Track user activity
  const handleActivity = () => {
    lastActiveTimeRef.current = Date.now();
    
    // Resume tracking if we were idle
    if (!isTrackingRef.current && enabled) {
      startTracking();
    }
  };

  // Track page visibility
  const handleVisibilityChange = () => {
    if (document.hidden) {
      stopTracking();
    } else if (enabled) {
      startTracking();
    }
  };

  useEffect(() => {
    if (!enabled) {
      stopTracking();
      return;
    }

    // Start tracking on mount
    startTracking();

    // Listen for user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Listen for page unload to save final time
    window.addEventListener("beforeunload", saveTime);

    // Cleanup
    return () => {
      stopTracking();
      
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", saveTime);
    };
  }, [partNumber, enabled]);

  return null;
}
