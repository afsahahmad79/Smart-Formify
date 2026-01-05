import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import * as auth from "./auth";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
  }).index("by_token", ["tokenIdentifier"]),
  
  forms: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    elements: v.array(v.object({
      id: v.string(),
      type: v.string(),
      label: v.string(),
      required: v.optional(v.boolean()),
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
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_creator", ["createdBy"]),

  submissions: defineTable({
    formId: v.id("forms"),
    data: v.object({}),
    submittedBy: v.string(),
    submittedAt: v.number(),
  }).index("by_form", ["formId"]),

  auth,
});