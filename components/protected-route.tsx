"use client"

import type React from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useEffect, useState } from "react"
import { AuthPage } from "./auth/auth-page"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, user } = useUser()
  const ensureUser = useMutation(api.users.mutations.ensureUser)
  const currentUser = useQuery(api.users.queries.getCurrent)
  const [isEnsuring, setIsEnsuring] = useState(false)
  const [hasEnsured, setHasEnsured] = useState(false)

  // Ensure user exists in database before rendering protected content
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // If user query has resolved and user doesn't exist, create them
      if (currentUser === null && !isEnsuring && !hasEnsured) {
        setIsEnsuring(true)
        ensureUser()
          .then(() => {
            setIsEnsuring(false)
            setHasEnsured(true)
          })
          .catch((error) => {
            console.error("Failed to ensure user:", error)
            setIsEnsuring(false)
            // Still allow rendering - queries will handle the error
            setHasEnsured(true)
          })
      } else if (currentUser !== null && currentUser !== undefined) {
        // User exists, mark as ensured
        setHasEnsured(true)
      }
    }
  }, [isLoaded, isSignedIn, user, currentUser, ensureUser, isEnsuring, hasEnsured])

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If not signed in, show auth page
  if (!isSignedIn) {
    return <AuthPage />
  }

  // Show loading while ensuring user exists (only if we're actively ensuring)
  if (isEnsuring && currentUser === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // User is authenticated, show protected content
  // Note: We allow rendering even if currentUser is null/undefined to avoid blocking
  // The ensureUser mutation will create the user, and queries will retry
  return <>{children}</>
}
