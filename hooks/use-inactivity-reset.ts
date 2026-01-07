import { useInactivityTimer } from "./use-inactivity-timer";

/**
 * Hook to reset the inactivity timer
 * Use this in components where you want to extend the user session
 * @deprecated Use useInactivityTimer() directly instead
 */
export function useInactivityReset() {
  const { resetTimer } = useInactivityTimer();
  
  return { resetTimer };
}
