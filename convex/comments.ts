import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export const add = mutation({
  args: {
    imageId: v.id("images"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated. Cannot add comment.");
    }
    if (!args.text.trim()) {
      throw new Error("Comment text cannot be empty.");
    }

    const image = await ctx.db.get(args.imageId);
    if (!image) {
      throw new Error("Image not found. Cannot add comment.");
    }

    await ctx.db.insert("comments", {
      imageId: args.imageId,
      userId,
      text: args.text,
    });

    // Increment comment count on the image
    const currentCommentCount = image.commentCount ?? 0;
    await ctx.db.patch(args.imageId, {
      commentCount: currentCommentCount + 1,
    });
  },
});

export const listByImage = query({
  args: { imageId: v.id("images") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_imageId", (q) => q.eq("imageId", args.imageId))
      .order("asc") 
      .collect();

    return Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        const commenterProfileData: { profileImageUrl: string | null } = await ctx.runQuery(internal.userProfiles.getProfileForUser, { userId: comment.userId });
        return {
          ...comment,
          commenterName: user?.name ?? user?.email ?? "Anonymous",
          commenterProfileImageUrl: commenterProfileData.profileImageUrl,
        };
      })
    );
  },
});
