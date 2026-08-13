"use client";

import { useEffect, useCallback } from "react";
import { usePinStore } from "@/stores/pin-store";
import { useBudgetStore } from "@/stores/budget-store";

const PIN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Manages PIN lock state: locks after 5 minutes of inactivity
 * or when the app is backgrounded and re-opened.
 */
export function usePinLock() {
  const pinStore = usePinStore();
  const settings = useBudgetStore((s) => s.settings);

  // Sync pinHash from settings
  useEffect(() => {
    const hash = settings?.pinHash ?? null;
    pinStore.setPinHash(hash);
    // If PIN is set and user just loaded, lock
    if (hash) {
      pinStore.setLocked(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.pinHash]);

  // Touch on user activity
  const handleActivity = useCallback(() => {
    pinStore.touch();
  }, [pinStore]);

  // Lock on visibility change (app backgrounded)
  useEffect(() => {
    if (!pinStore.pinHash) return;

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        pinStore.touch(); // Mark time when hidden
      } else if (document.visibilityState === "visible") {
        const elapsed = Date.now() - pinStore.lastActiveAt;
        if (elapsed > PIN_TIMEOUT_MS) {
          pinStore.setLocked(true);
          pinStore.resetFailedAttempts();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    // Also check on interval for background timeout
    const interval = setInterval(() => {
      if (pinStore.pinHash && !pinStore.isLocked) {
        const elapsed = Date.now() - pinStore.lastActiveAt;
        if (elapsed > PIN_TIMEOUT_MS) {
          pinStore.setLocked(true);
          pinStore.resetFailedAttempts();
        }
      }
    }, 30_000); // Check every 30s

    // Track user activity
    const events = ["pointerdown", "keydown", "scroll"] as const;
    for (const event of events) {
      document.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
      for (const event of events) {
        document.removeEventListener(event, handleActivity);
      }
    };
  }, [pinStore, handleActivity]);

  return {
    isLocked: pinStore.isLocked && pinStore.pinHash !== null,
    hasPinSet: pinStore.pinHash !== null,
    failedAttempts: pinStore.failedAttempts,
  };
}
