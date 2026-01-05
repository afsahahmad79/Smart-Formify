import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createForm = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    elements: v.array(v.object({
      id: v.string(),
      type: v.string(),
      label: v.string(),
      required: v.boolean(),
      options: v.optional(v.array(v.string())),
      placeholder: v.optional(v.string()),
      validation: v.optional(v.object({
        minLength: v.optional(v.number()),
        maxLength: v.optional(v.number()),
        pattern: v.optional(v.string()),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const formId = await ctx.db.insert("forms", {
      title: args.title,
      description: args.description,
      elements: args.elements,
      status: "draft",
      createdBy: identity.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return formId;
  },
});

export const updateForm = mutation({
  args: {
    id: v.id("forms"),
    title: v.string(),
    description: v.optional(v.string()),
    elements: v.array(v.object({
      id: v.string(),
      type: v.string(),
      label: v.string(),
      required: v.boolean(),
      options: v.optional(v.array(v.string())),
      placeholder: v.optional(v.string()),
      validation: v.optional(v.object({
        minLength: v.optional(v.number()),
        maxLength: v.optional(v.number()),
        pattern: v.optional(v.string()),
      })),
    })),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("unpublished"))),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingForm = await ctx.db.get(args.id);
    if (!existingForm) {
      throw new Error("Form not found");
    }

    if (existingForm.createdBy !== identity.subject) {
      throw new Error("Not authorized");
    }

    const updates = {
      title: args.title,
      description: args.description,
      elements: args.elements,
      updatedAt: Date.now(),
    };

    if (args.status !== undefined) updates.status = args.status;
    if (args.publishedAt !== undefined) updates.publishedAt = args.publishedAt;

    await ctx.db.patch(args.id, updates);
  },
});

export const publishForm = mutation({
  args: { 
    id: v.id("forms"),
    shareUrl: v.string(),
    embedCode: v.string(),
    allowAnonymous: v.boolean(),
    collectEmails: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingForm = await ctx.db.get(args.id);
    if (!existingForm) {
      throw new Error("Form not found");
    }

    if (existingForm.createdBy !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, {
      status: "published",
      publishedAt: Date.now(),
      shareUrl: args.shareUrl,
      embedCode: args.embedCode,
      allowAnonymous: args.allowAnonymous,
      collectEmails: args.collectEmails,
      updatedAt: Date.now(),
    });
  },
});

export const unpublishForm = mutation({
  args: { id: v.id("forms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingForm = await ctx.db.get(args.id);
    if (!existingForm) {
      throw new Error("Form not found");
    }

    if (existingForm.createdBy !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, {
      status: "unpublished",
      updatedAt: Date.now(),
    });
  },
});
