"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
// ...other imports


import { AuthProvider } from "@/components/auth/auth-context";
import "../components/errors/intercept-console-error";
import { ErrorBoundary } from "@/components/errors/error-boundary";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        variables: { colorPrimary: "#000000" },
        elements: {
          formButtonPrimary:
            "bg-black border border-black hover:bg-white hover:text-black",
          socialButtonsBlockButton:
            "bg-white border-gray-200 hover:bg-transparent hover:border-black text-gray-500 hover:text-black",
          socialButtonsBlockButtonText: "font-semibold",
          formButtonReset:
            "bg-white border border-gray-200 hover:bg-transparent hover:border-black text-gray-500 hover:text-black",
          membersPageInviteButton:
            "bg-black border border-black hover:bg-white hover:text-black",
          card: "bg-gray-50",
        },
      }}
      signInUrl="/auth/sign-in"
      signUpUrl="/auth/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      {/* Convex + Clerk Integration */}
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AuthProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
