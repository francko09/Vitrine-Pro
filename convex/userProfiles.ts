import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const generateProfileImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated. Cannot generate upload URL.");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const setProfileImage = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated. Cannot set profile image.");
    }

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      if (existingProfile.profileImageStorageId) {
        // Delete old profile image if it exists
        try {
            await ctx.storage.delete(existingProfile.profileImageStorageId);
        } catch (e) {
            console.warn(`Failed to delete old profile image ${existingProfile.profileImageStorageId}: ${e}`);
        }
      }
      await ctx.db.patch(existingProfile._id, {
        profileImageStorageId: args.storageId,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        profileImageStorageId: args.storageId,
      });
    }
  },
});

export const getProfileForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    let profileImageUrl: string | null = null;
    if (profile?.profileImageStorageId) {
      profileImageUrl = await ctx.storage.getUrl(profile.profileImageStorageId);
    }
    return { profileImageUrl };
  },
});

export const getCurrentUserProfileImageUrl = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    
    if (profile?.profileImageStorageId) {
      return await ctx.storage.getUrl(profile.profileImageStorageId);
    }
    return null;
  }
})
