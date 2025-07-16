import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  images: defineTable({
    userId: v.id("users"),
    storageId: v.id("_storage"),
    title: v.optional(v.string()), 
    description: v.optional(v.string()),
    contact: v.optional(v.string()),
    location: v.optional(v.string()),
    likes: v.array(v.id("users")),
    commentCount: v.optional(v.number()),
    shareCount: v.optional(v.number()),
    // New fields for reposts
    isRepost: v.optional(v.boolean()),
    originalImageId: v.optional(v.id("images")),
    repostComment: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_storageId", ["storageId"])
    .index("by_originalImageId", ["originalImageId"])
    .searchIndex("search_title", {
      searchField: "title",
    })
    .searchIndex("search_description", {
      searchField: "description",
    }),

  comments: defineTable({
    imageId: v.id("images"),
    userId: v.id("users"),
    text: v.string(),
  }).index("by_imageId", ["imageId"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    profileImageStorageId: v.optional(v.id("_storage")),
  }).index("by_userId", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
