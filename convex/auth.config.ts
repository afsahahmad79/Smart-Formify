// This file configures authentication for Convex
// Clerk is configured with production keys

// Get Clerk domain from environment or use default
// The domain should match your Clerk instance (check your Clerk dashboard)
const clerkDomain = process.env.CLERK_ISSUER_URL?.replace('https://', '').replace('/', '') || "ethical-gibbon-40.clerk.accounts.dev";

export default {
  providers: [
    // Main Clerk provider for email/password authentication
    // Note: applicationID must match the JWT template name in Clerk (should be "convex")
    {
      domain: `https://${clerkDomain}`,
      applicationID: "convex",
    }, 
  ],
};
