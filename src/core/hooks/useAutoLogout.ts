import { useEffect, useRef, useCallback } from "react";

const TIMEOUT_MS = 30 * 60 * 1000; // 1 minute

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
];

export const useAutoLogout = (onLogout: () => void) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onLogout();
    }, TIMEOUT_MS);
  }, [onLogout]);

  useEffect(() => {
    // Start timer on mount
    resetTimer();

    // Reset on any user activity
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true }),
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer),
      );
    };
  }, [resetTimer]);
};
