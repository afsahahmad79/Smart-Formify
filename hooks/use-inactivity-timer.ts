import { useClerk, useUser } from "@clerk/nextjs"
import { useEffect, useRef } from "react"

/**
 * Hook to manage inactivity timer that automatically signs out users after inactivity
 * @param timeoutMs - Timeout in milliseconds (default: 5 minutes)
 */
export function useInactivityTimer(timeoutMs = 5 * 60 * 1000) {
  const clerk = useClerk()
  const { user } = useUser()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!user) {
      // Clear timer if user logs out
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    
    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        console.log("Inactivity timeout reached, signing out...")
        clerk.signOut()
      }, timeoutMs)
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true })
    })

    // Initialize timer
    resetTimer()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer)
      })
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [user, clerk, timeoutMs])

  // Function to manually reset the timer (can be called from components)
  const resetTimer = () => {
    if (!user) return
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      console.log("Inactivity timeout reached, signing out...")
      clerk.signOut()
    }, timeoutMs)
  }

  return { resetTimer }
}

