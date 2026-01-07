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

export const getForm = query({
    args: { id: v.id("forms") },
    handler: async (ctx, args) => {
        const form = await ctx.db.get(args.id);
        if (!form) {
            throw new Error("Form not found");
        }
        return form;
    },
});

export const getPublishedForm = query({
    args: { id: v.id("forms") },
    handler: async (ctx, args) => {
        const form = await ctx.db.get(args.id);
        if (!form || form.status !== "published") {
            throw new Error("Form not found or not published");
        }
        return form;
    },
});

export const listForms = query({
    args: {
        paginationOpts: v.optional(v.object({
            numItems: v.number(),
            cursor: v.union(v.string(), v.null()),
        })),
    },
    handler: async (ctx, args) => {
        const user = await getUser(ctx);

        // If user doesn't exist yet, return empty results
        // The ensureUser mutation will create the user, and queries will retry
        if (!user) {
            return {
                page: [],
                isDone: true,
                continueCursor: null,
            };
        }

        const paginationOpts = args.paginationOpts || { numItems: 12, cursor: null };

        // Get all forms for the user and sort by updatedAt descending
        // Note: For better performance with large datasets, consider adding a composite index
        const allForms = await ctx.db
            .query("forms")
            .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
            .collect();

        // Sort by updatedAt descending (most recently updated first)
        allForms.sort((a, b) => b.updatedAt - a.updatedAt);

        // Manual pagination using offset (cursor is the last form ID from previous page)
        let startIndex = 0;
        if (paginationOpts.cursor) {
            const cursorIndex = allForms.findIndex(f => f._id === paginationOpts.cursor);
            startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
        }

        const endIndex = startIndex + paginationOpts.numItems;
        const page = allForms.slice(startIndex, endIndex);
        const isDone = endIndex >= allForms.length;
        const continueCursor = !isDone && page.length > 0 ? page[page.length - 1]._id : null;

        return {
            page,
            isDone,
            continueCursor: continueCursor as string | null,
        };
    },
});

