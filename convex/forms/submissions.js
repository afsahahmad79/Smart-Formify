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
    const submissionId = await ctx.db.insert("submissions", {
      formId: args.formId,
      data: args.data,
      submittedBy: identity ? identity.subject : "anonymous",
      submittedAt: Date.now(),
    });
    return submissionId;
  },
});
