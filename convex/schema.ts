
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    createdAt: v.optional(v.float64()),
    email: v.optional(v.string()),
    name: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    tokenIdentifier: v.string(), // Required for Clerk authentication
    deleted: v.optional(v.boolean()),
  }).index("by_token", ["tokenIdentifier"]),

  forms: defineTable({
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
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("unpublished")),
    publishedAt: v.optional(v.number()),
    shareUrl: v.optional(v.string()),
    embedCode: v.optional(v.string()),
    allowAnonymous: v.optional(v.boolean()),
    collectEmails: v.optional(v.boolean()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_creator", ["createdBy"]),

  submissions: defineTable({
    formId: v.id("forms"),
    data: v.any(), // Allow any object structure for form data
    submittedBy: v.union(v.id("users"), v.string()), // Allow user ID or "anonymous"
    submittedAt: v.number(),
    submitterEmail: v.optional(v.string()),
    submitterName: v.optional(v.string()),
    status: v.optional(v.union(v.literal("new"), v.literal("reviewed"), v.literal("archived"))),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }).index("by_form", ["formId"]),

  sessions: defineTable({
    userId: v.id("users"),
    lastActiveAt: v.number(),
    expiresAt: v.number(),
  }).index("by_user", ["userId"]),
});