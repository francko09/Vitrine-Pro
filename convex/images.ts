import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const createImage = mutation({
  args: {
    storageId: v.id("_storage"),
    title: v.string(),
    description: v.optional(v.string()),
    contact: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }
    await ctx.db.insert("images", {
      userId,
      storageId: args.storageId,
      title: args.title,
      description: args.description,
      contact: args.contact,
      location: args.location,
      likes: [],
      commentCount: 0,
      shareCount: 0,
      isRepost: false,
    });
  },
});

export const repostImage = mutation({
  args: {
    originalImageId: v.id("images"),
    repostComment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const originalImage = await ctx.db.get(args.originalImageId);
    if (!originalImage) {
      throw new Error("Original image not found");
    }

    // Check if user is trying to repost their own image
    if (originalImage.userId === userId) {
      throw new Error("You cannot repost your own image");
    }

    // Check if user has already reposted this image
    const existingRepost = await ctx.db
      .query("images")
      .withIndex("by_originalImageId", (q) => q.eq("originalImageId", args.originalImageId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existingRepost) {
      throw new Error("You have already reposted this image");
    }

    // Create the repost
    await ctx.db.insert("images", {
      userId,
      storageId: originalImage.storageId,
      title: originalImage.title,
      description: originalImage.description,
      contact: originalImage.contact,
      location: originalImage.location,
      likes: [],
      commentCount: 0,
      shareCount: 0,
      isRepost: true,
      originalImageId: args.originalImageId,
      repostComment: args.repostComment,
    });

    // Increment share count on original image
    const currentShareCount = originalImage.shareCount ?? 0;
    await ctx.db.patch(args.originalImageId, {
      shareCount: currentShareCount + 1,
    });
  },
});

export const searchImages = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args): Promise<any[]> => {
    if (!args.searchTerm.trim()) {
      return [];
    }

    // Search by title
    const titleResults = await ctx.db
      .query("images")
      .withSearchIndex("search_title", (q) => q.search("title", args.searchTerm))
      .take(20);

    // Search by description
    const descriptionResults = await ctx.db
      .query("images")
      .withSearchIndex("search_description", (q) => q.search("description", args.searchTerm))
      .take(20);

    // Combine and deduplicate results
    const allResults = [...titleResults, ...descriptionResults];
    const uniqueResults = allResults.filter((image, index, self) => 
      index === self.findIndex(i => i._id === image._id)
    );

    const imagesWithDetails: any[] = await Promise.all(
      uniqueResults.map(async (image): Promise<any> => {
        const url = await ctx.storage.getUrl(image.storageId);
        const user = await ctx.db.get(image.userId);
        const uploaderProfileData: { profileImageUrl: string | null } = await ctx.runQuery(internal.userProfiles.getProfileForUser, { userId: image.userId });
        
        let originalImage = null;
        let originalUploader = null;
        let originalUploaderProfileData = null;

        if (image.isRepost && image.originalImageId) {
          originalImage = await ctx.db.get(image.originalImageId);
          if (originalImage) {
            originalUploader = await ctx.db.get(originalImage.userId);
            originalUploaderProfileData = await ctx.runQuery(internal.userProfiles.getProfileForUser, { userId: originalImage.userId });
          }
        }

        return {
          ...image,
          url,
          uploader: user?.name ?? user?.email ?? "Anonymous",
          uploaderProfileImageUrl: uploaderProfileData.profileImageUrl,
          commentCount: image.commentCount ?? 0,
          shareCount: image.shareCount ?? 0,
          originalUploader: originalUploader?.name ?? originalUploader?.email ?? null,
          originalUploaderProfileImageUrl: originalUploaderProfileData?.profileImageUrl ?? null,
        };
      })
    );
    return imagesWithDetails.filter((image: any) => image.url !== null);
  },
});

export const listGlobalImages = query({
  args: {},
  handler: async (ctx): Promise<any[]> => {
    const images = await ctx.db.query("images").order("desc").collect();
    const imagesWithDetails: any[] = await Promise.all(
      images.map(async (image): Promise<any> => {
        const url = await ctx.storage.getUrl(image.storageId);
        const user = await ctx.db.get(image.userId);
        const uploaderProfileData: { profileImageUrl: string | null } = await ctx.runQuery(internal.userProfiles.getProfileForUser, { userId: image.userId });
        
        let originalImage = null;
        let originalUploader = null;
        let originalUploaderProfileData = null;

        if (image.isRepost && image.originalImageId) {
          originalImage = await ctx.db.get(image.originalImageId);
          if (originalImage) {
            originalUploader = await ctx.db.get(originalImage.userId);
            originalUploaderProfileData = await ctx.runQuery(internal.userProfiles.getProfileForUser, { userId: originalImage.userId });
          }
        }

        return {
          ...image,
          url,
          uploader: user?.name ?? user?.email ?? "Anonymous",
          uploaderProfileImageUrl: uploaderProfileData.profileImageUrl,
          commentCount: image.commentCount ?? 0,
          shareCount: image.shareCount ?? 0,
          originalUploader: originalUploader?.name ?? originalUploader?.email ?? null,
          originalUploaderProfileImageUrl: originalUploaderProfileData?.profileImageUrl ?? null,
        };
      })
    );
    return imagesWithDetails.filter((image: any) => image.url !== null);
  },
});

export const listUserImages = query({
  args: {},
  handler: async (ctx): Promise<any[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const images = await ctx.db
      .query("images")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    
    const imagesWithDetails: any[] = await Promise.all(
      images.map(async (image): Promise<any> => {
        const url = await ctx.storage.getUrl(image.storageId);
        
        let originalImage = null;
        let originalUploader = null;
        let originalUploaderProfileData = null;

        if (image.isRepost && image.originalImageId) {
          originalImage = await ctx.db.get(image.originalImageId);
          if (originalImage) {
            originalUploader = await ctx.db.get(originalImage.userId);
            originalUploaderProfileData = await ctx.runQuery(internal.userProfiles.getProfileForUser, { userId: originalImage.userId });
          }
        }

        return {
          ...image,
          url,
          commentCount: image.commentCount ?? 0,
          shareCount: image.shareCount ?? 0,
          originalUploader: originalUploader?.name ?? originalUploader?.email ?? null,
          originalUploaderProfileImageUrl: originalUploaderProfileData?.profileImageUrl ?? null,
        };
      })
    );
    return imagesWithDetails.filter((image: any) => image.url !== null);
  },
});

export const deleteImage = mutation({
  args: { imageId: v.id("images"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      throw new Error("Image not found");
    }
    if (image.userId !== userId) {
      throw new Error("User not authorized to delete this image");
    }

    const commentsToDelete = await ctx.db
      .query("comments")
      .withIndex("by_imageId", (q) => q.eq("imageId", args.imageId))
      .collect();
    for (const comment of commentsToDelete) {
      await ctx.db.delete(comment._id);
    }

    // If this is a repost, don't delete the storage file (it belongs to the original)
    if (!image.isRepost) {
      await ctx.storage.delete(args.storageId);
    }

    await ctx.db.delete(args.imageId);
  },
});

export const likeImage = mutation({
  args: { imageId: v.id("images") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      throw new Error("Image not found");
    }
    if (!image.likes.includes(userId)) {
      await ctx.db.patch(args.imageId, {
        likes: [...image.likes, userId],
      });
    }
  },
});

export const unlikeImage = mutation({
  args: { imageId: v.id("images") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      throw new Error("Image not found");
    }
    if (image.likes.includes(userId)) {
      await ctx.db.patch(args.imageId, {
        likes: image.likes.filter((id) => id !== userId),
      });
    }
  },
});

export const getImage = query({
  args: { imageId: v.id("images") },
  handler: async (ctx, args): Promise<any> => {
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      return null;
    }
    const url = await ctx.storage.getUrl(image.storageId);
    const user = await ctx.db.get(image.userId);
    const uploaderProfileData: { profileImageUrl: string | null } = await ctx.runQuery(internal.userProfiles.getProfileForUser, { userId: image.userId });

    let originalImage = null;
    let originalUploader = null;
    let originalUploaderProfileData = null;

    if (image.isRepost && image.originalImageId) {
      originalImage = await ctx.db.get(image.originalImageId);
      if (originalImage) {
        originalUploader = await ctx.db.get(originalImage.userId);
        originalUploaderProfileData = await ctx.runQuery(internal.userProfiles.getProfileForUser, { userId: originalImage.userId });
      }
    }

    return {
      ...image,
      url,
      uploader: user?.name ?? user?.email ?? "Anonymous",
      uploaderProfileImageUrl: uploaderProfileData.profileImageUrl,
      commentCount: image.commentCount ?? 0,
      shareCount: image.shareCount ?? 0,
      originalUploader: originalUploader?.name ?? originalUploader?.email ?? null,
      originalUploaderProfileImageUrl: originalUploaderProfileData?.profileImageUrl ?? null,
    };
  }
});
