import { query } from "../_generated/server";
import { v } from "convex/values";
import type { DataModel } from "../_generated/dataModel";

/**
 * Helper function to get a user from Clerk identity
 * Returns null if user doesn't exist (queries cannot create users - use mutations for user creation)
 */
async function getUser(
    ctx: { db: any; auth: any }
): Promise<DataModel["users"]["document"] | null> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Not authenticated");
    }

    // Try to find existing user
    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();

    // Return null instead of throwing - the ensureUser mutation will create the user
    return user || null;
}

export const listSubmissions = query({
    handler: async (ctx) => {
        // Get user (queries cannot create users)
        const user = await getUser(ctx);

        // If user doesn't exist yet, return empty results
        // The ensureUser mutation will create the user, and queries will retry
        if (user === null) {
            return [];
        }

        // Get all forms created by this user
        // user is guaranteed to be non-null here due to early return above
        const userId = user._id;
        const userForms = await ctx.db
            .query("forms")
            .withIndex("by_creator", (q) => q.eq("createdBy", userId))
            .collect();

        const formIds = userForms.map((f) => f._id);

        // Get all submissions for forms created by this user
        const allSubmissions = await ctx.db.query("submissions").collect();
        const submissions = allSubmissions.filter((s) => formIds.includes(s.formId));

        // Create a map of form IDs to form names for quick lookup
        const formMap = new Map(userForms.map((f) => [String(f._id), f.title]));

        return submissions.map((s) => {
            const form = formMap.get(String(s.formId));
            return {
                id: String(s._id),
                formId: String(s.formId),
                formName: form || "Unknown Form",
                submittedAt: s.submittedAt,
                submitterEmail: s.submitterEmail || "Anonymous",
                submitterName: s.submitterName || "Anonymous",
                status: s.status || "new",
                data: s.data || {},
                ipAddress: s.ipAddress,
                userAgent: s.userAgent,
            };
        });
    },
});

