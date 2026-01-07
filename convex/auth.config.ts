// This file configures authentication for Convex
// Clerk is configured according to Convex documentation
// https://docs.convex.dev/auth/clerk

import type { AuthConfig } from "convex/server";

// IMPORTANT: Set CLERK_JWT_ISSUER_DOMAIN in your Convex dashboard (Settings > Environment Variables)
// NOT in your local .env file - it must be set in Convex dashboard for both dev and prod
//
// To find your Clerk issuer domain:
// 1. Go to Clerk Dashboard > API Keys
// 2. Look for "Frontend API" or "Issuer" - it should be like: https://your-app-name.clerk.accounts.dev
// 3. Copy the full URL (including https://)
// 4. Set it as CLERK_JWT_ISSUER_DOMAIN in Convex dashboard
//
// Also ensure you have a JWT template named "convex" in Clerk Dashboard with:
// - aud claim set to "convex"
// - iss claim matching your Clerk issuer domain

const clerkIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

if (!clerkIssuerDomain) {
  throw new Error(
    "CLERK_JWT_ISSUER_DOMAIN is not set. " +
    "Please set it in your Convex dashboard (Settings > Environment Variables). " +
    "It should be your Clerk issuer domain (e.g., https://your-app.clerk.accounts.dev)"
  );
}

// Validate that it's a Clerk domain, not a Convex domain
if (clerkIssuerDomain.includes("convex.cloud")) {
  throw new Error(
    `Invalid CLERK_JWT_ISSUER_DOMAIN: "${clerkIssuerDomain}". ` +
    "This appears to be a Convex domain, not a Clerk domain. " +
    "Please set it to your Clerk issuer domain (e.g., https://your-app.clerk.accounts.dev)"
  );
}

export default {
  providers: [
    {
      domain: clerkIssuerDomain,
      // applicationID must match the JWT template name in Clerk dashboard ("convex")
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
