import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

export const updateRole = mutation({
    args: {
        id: v.id("users"),
        role: v.union(v.literal("user"), v.literal("admin")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!currentUser || currentUser.role !== "admin") {
            throw new Error("Not authorized");
        }

        const targetUser = await ctx.db.get(args.id);
        if (!targetUser) {
            throw new Error("User not found");
        }

        await ctx.db.patch(args.id, { role: args.role });
    },
});

export const deleteUser = mutation({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!currentUser || currentUser.role !== "admin") {
            throw new Error("Not authorized");
        }

        const targetUser = await ctx.db.get(args.id);
        if (!targetUser) {
            throw new Error("User not found");
        }

        // Prevent self-deletion
        if (targetUser._id === currentUser._id) {
            throw new Error("Cannot delete yourself");
        }

        await ctx.db.delete(args.id);
    },
});

/**
 * Ensure user exists in database, creating if necessary
 * This is a fallback for when webhooks fail or user signs in before webhook fires
 */
export const ensureUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Try to find existing user
        let user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        // If user doesn't exist, create them
        if (!user) {
            const name = identity.name || identity.email?.split("@")[0] || "User";
            const userId = await ctx.db.insert("users", {
                tokenIdentifier: identity.tokenIdentifier,
                email: identity.email,
                name: name,
                role: "user",
                createdAt: Date.now(),
            });
            user = await ctx.db.get(userId);
            if (!user) {
                throw new Error("Failed to create user");
            }
            return { userId, created: true };
        }

        return { userId: user._id, created: false };
    },
});

// Note: Signup and login are now handled by Clerk
// Users are synced to Convex via webhooks (see convex/users/webhooks.ts)
// Authentication is managed by Clerk, and Convex uses Clerk's JWT tokens

