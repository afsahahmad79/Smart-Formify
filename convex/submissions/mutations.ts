import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const submitForm = mutation({
    args: {
        formId: v.id("forms"),
        data: v.any(),
        submitterName: v.optional(v.string()),
        submitterEmail: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Get the form to check its settings
        const form = await ctx.db.get(args.formId);
        if (!form) {
            throw new Error("Form not found");
        }

        // Check if anonymous submissions are allowed
        if (!form.allowAnonymous) {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                throw new Error("Authentication required to submit this form");
            }
        }

        // Check if email collection is required
        if (form.collectEmails && !args.submitterEmail) {
            throw new Error("Email is required to submit this form");
        }

        const identity = await ctx.auth.getUserIdentity();

        // Get user ID if authenticated, otherwise use "anonymous"
        let submittedBy: string | any = "anonymous";
        if (identity) {
            // Try to find the user in the database
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .first();
            if (user) {
                submittedBy = user._id;
            } else {
                // If user doesn't exist, use the identity subject as fallback
                submittedBy = identity.subject;
            }
        }

        const submissionId = await ctx.db.insert("submissions", {
            formId: args.formId,
            data: args.data,
            submittedBy: submittedBy,
            submittedAt: Date.now(),
            submitterEmail: args.submitterEmail,
            submitterName: args.submitterName,
            status: "new", // Default status for new submissions
        });
        return submissionId;
    },
});

// Update submission status
export const updateSubmissionStatus = mutation({
    args: {
        id: v.id("submissions"),
        status: v.union(v.literal("new"), v.literal("reviewed"), v.literal("archived")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Get the submission
        const submission = await ctx.db.get(args.id);
        if (!submission) {
            throw new Error("Submission not found");
        }

        // Get the form to check ownership
        const form = await ctx.db.get(submission.formId);
        if (!form) {
            throw new Error("Form not found");
        }

        // Get or create user
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        // Check if user owns the form
        if (form.createdBy !== user._id) {
            throw new Error("Not authorized");
        }

        // Update the submission status
        await ctx.db.patch(args.id, {
            status: args.status,
        });
    },
});

// Delete submission
export const deleteSubmission = mutation({
    args: {
        id: v.id("submissions"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Get the submission
        const submission = await ctx.db.get(args.id);
        if (!submission) {
            throw new Error("Submission not found");
        }

        // Get the form to check ownership
        const form = await ctx.db.get(submission.formId);
        if (!form) {
            throw new Error("Form not found");
        }

        // Get or create user
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        // Check if user owns the form
        if (form.createdBy !== user._id) {
            throw new Error("Not authorized");
        }

        // Delete the submission
        await ctx.db.delete(args.id);
    },
});

// Bulk update submission status
export const bulkUpdateSubmissionStatus = mutation({
    args: {
        ids: v.array(v.id("submissions")),
        status: v.union(v.literal("new"), v.literal("reviewed"), v.literal("archived")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Get or create user
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        // Update each submission
        for (const id of args.ids) {
            const submission = await ctx.db.get(id);
            if (!submission) continue;

            // Get the form to check ownership
            const form = await ctx.db.get(submission.formId);
            if (!form || form.createdBy !== user._id) continue;

            // Update the submission status
            await ctx.db.patch(id, {
                status: args.status,
            });
        }
    },
});

// Bulk delete submissions
export const bulkDeleteSubmissions = mutation({
    args: {
        ids: v.array(v.id("submissions")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Get or create user
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        // Delete each submission
        for (const id of args.ids) {
            const submission = await ctx.db.get(id);
            if (!submission) continue;

            // Get the form to check ownership
            const form = await ctx.db.get(submission.formId);
            if (!form || form.createdBy !== user._id) continue;

            // Delete the submission
            await ctx.db.delete(id);
        }
    },
});

