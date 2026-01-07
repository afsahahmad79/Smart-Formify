import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { DataModel } from "../_generated/dataModel";

/**
 * Helper function to get or create a user from Clerk identity
 */
async function getOrCreateUser(
  ctx: { db: any; auth: any }
): Promise<DataModel["users"]["document"]> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  // Try to find existing user
  let user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
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
  }

  return user;
}

export const createForm = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    elements: v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal("text"),
        v.literal("email"),
        v.literal("textarea"),
        v.literal("select"),
        v.literal("radio"),
        v.literal("checkbox"),
        v.literal("number")
      ),
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
    // Get or create user
    const user = await getOrCreateUser(ctx);

    const formId = await ctx.db.insert("forms", {
      title: args.title,
      description: args.description,
      elements: args.elements,
      status: "draft",
      createdBy: user._id,
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
      type: v.union(
        v.literal("text"),
        v.literal("email"),
        v.literal("textarea"),
        v.literal("select"),
        v.literal("radio"),
        v.literal("checkbox"),
        v.literal("number")
      ),
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
    // Get or create user
    const user = await getOrCreateUser(ctx);

    const existingForm = await ctx.db.get(args.id);
    if (!existingForm) {
      throw new Error("Form not found");
    }

    if (existingForm.createdBy !== user._id) {
      throw new Error("Not authorized");
    }

    const updates: {
      title: string;
      description: string | undefined;
      elements: typeof args.elements;
      updatedAt: number;
      status?: typeof args.status;
      publishedAt?: number;
    } = {
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
    // Get or create user
    const user = await getOrCreateUser(ctx);

    const existingForm = await ctx.db.get(args.id);
    if (!existingForm) {
      throw new Error("Form not found");
    }

    if (existingForm.createdBy !== user._id) {
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
    // Get or create user
    const user = await getOrCreateUser(ctx);

    const existingForm = await ctx.db.get(args.id);
    if (!existingForm) {
      throw new Error("Form not found");
    }

    if (existingForm.createdBy !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, {
      status: "unpublished",
      updatedAt: Date.now(),
    });
  },
});
