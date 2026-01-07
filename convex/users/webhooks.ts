import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Sync user from Clerk webhook
 * Called directly from Next.js webhook handler
 */
export const syncUserFromClerk = mutation({
    args: {
        webhookSecret: v.string(), // Secret to verify the call is from our webhook handler
        tokenIdentifier: v.string(),
        email: v.optional(v.string()),
        name: v.string(),
        clerkId: v.string(),
        createdAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Verify webhook secret
        const expectedSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!expectedSecret || args.webhookSecret !== expectedSecret) {
            throw new Error("Unauthorized: Invalid webhook secret");
        }

        // Check if user already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
            .first();

        if (existingUser) {
            // Update existing user
            await ctx.db.patch(existingUser._id, {
                email: args.email,
                name: args.name,
                // Don't update tokenIdentifier as it's the key
            });
            return { userId: existingUser._id, created: false };
        } else {
            // Create new user
            const userId = await ctx.db.insert("users", {
                tokenIdentifier: args.tokenIdentifier,
                email: args.email,
                name: args.name,
                role: "user",
                createdAt: args.createdAt || Date.now(),
            });
            return { userId, created: true };
        }
    },
});

/**
 * Mark user as deleted from Clerk webhook (soft delete)
 */
export const deleteUserFromClerk = mutation({
    args: {
        webhookSecret: v.string(), // Secret to verify the call is from our webhook handler
        tokenIdentifier: v.string(),
    },
    handler: async (ctx, args) => {
        // Verify webhook secret
        const expectedSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!expectedSecret || args.webhookSecret !== expectedSecret) {
            throw new Error("Unauthorized: Invalid webhook secret");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
            .first();

        if (user) {
            await ctx.db.patch(user._id, {
                deleted: true,
            });
            return { deleted: true };
        }
        return { deleted: false };
    },
});

/**
 * Sync session from Clerk webhook
 */
export const syncSessionFromClerk = mutation({
    args: {
        webhookSecret: v.string(), // Secret to verify the call is from our webhook handler
        sessionId: v.string(),
        tokenIdentifier: v.string(),
        lastActiveAt: v.number(),
        expiresAt: v.number(),
    },
    handler: async (ctx, args) => {
        // Verify webhook secret
        const expectedSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!expectedSecret || args.webhookSecret !== expectedSecret) {
            throw new Error("Unauthorized: Invalid webhook secret");
        }

        // Find user by tokenIdentifier
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
            .first();

        if (!user) {
            console.warn(`User not found for tokenIdentifier: ${args.tokenIdentifier}`);
            return { synced: false };
        }

        // Check if session already exists (we'll use sessionId as a unique identifier)
        // Since we don't have sessionId in schema, we'll update or create based on userId
        const existingSession = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        if (existingSession) {
            // Update existing session
            await ctx.db.patch(existingSession._id, {
                lastActiveAt: args.lastActiveAt,
                expiresAt: args.expiresAt,
            });
            return { sessionId: existingSession._id, created: false };
        } else {
            // Create new session
            const sessionId = await ctx.db.insert("sessions", {
                userId: user._id,
                lastActiveAt: args.lastActiveAt,
                expiresAt: args.expiresAt,
            });
            return { sessionId, created: true };
        }
    },
});

