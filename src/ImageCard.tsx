import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Doc, Id } from '../convex/_generated/dataModel';
import { toast } from 'sonner';
import { useState } from 'react';
import { CommentSection } from './CommentSection';

export type ImageCardData = Doc<'images'> & {
  url: string | null;
  uploader: string;
  uploaderProfileImageUrl?: string | null;
  commentCount: number;
  shareCount: number;
  originalUploader?: string | null;
  originalUploaderProfileImageUrl?: string | null;
};

interface ImageCardProps {
  image: ImageCardData;
  currentUserId?: Id<'users'> | null;
  allowDelete: boolean;
}

export function ImageCard({
  image,
  currentUserId,
  allowDelete,
}: ImageCardProps) {
  const {
    _id: imageId,
    storageId,
    url: imageUrl,
    title,
    description,
    contact,
    location,
    uploader,
    uploaderProfileImageUrl,
    likes,
    commentCount: initialCommentCount,
    shareCount: initialShareCount,
    userId: imageOwnerId,
    isRepost,
    originalImageId,
    repostComment,
    originalUploader,
    originalUploaderProfileImageUrl,
  } = image;

  const likeImageMutation = useMutation(api.images.likeImage);
  const unlikeImageMutation = useMutation(api.images.unlikeImage);
  const deleteImageMutation = useMutation(api.images.deleteImage);
  const repostImageMutation = useMutation(api.images.repostImage);

  const imageDetailsQuery = useQuery(api.images.getImage, { imageId });

  const [showRepostDialog, setShowRepostDialog] = useState(false);
  const [repostCommentText, setRepostCommentText] = useState('');
  const [isReposting, setIsReposting] = useState(false);

  const displayTitle = imageDetailsQuery?.title ?? title ?? 'Untitled';
  const displayDescription = imageDetailsQuery?.description ?? description;
  const displayContact = imageDetailsQuery?.contact ?? contact;
  const displayLocation = imageDetailsQuery?.location ?? location;
  const currentLikes = imageDetailsQuery?.likes ?? likes;
  const displayUploaderName = imageDetailsQuery?.uploader ?? uploader;
  const displayUploaderProfileImageUrl =
    imageDetailsQuery?.uploaderProfileImageUrl ?? uploaderProfileImageUrl;
  const displayCommentCount =
    imageDetailsQuery?.commentCount ?? initialCommentCount ?? 0;
  const displayShareCount =
    imageDetailsQuery?.shareCount ?? initialShareCount ?? 0;
  const displayOriginalUploader =
    imageDetailsQuery?.originalUploader ?? originalUploader;
  const displayOriginalUploaderProfileImageUrl =
    imageDetailsQuery?.originalUploaderProfileImageUrl ??
    originalUploaderProfileImageUrl;

  const hasLiked = currentUserId ? currentLikes.includes(currentUserId) : false;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLikeToggle = async () => {
    if (!currentUserId) {
      toast.error('You must be logged in to like photos.');
      return;
    }
    try {
      if (hasLiked) {
        await unlikeImageMutation({ imageId });
      } else {
        await likeImageMutation({ imageId });
      }
    } catch (error) {
      toast.error('Failed to update like status.');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (
      !allowDelete ||
      !currentUserId ||
      imageOwnerId !== currentUserId ||
      !storageId
    ) {
      toast.error(
        'You are not authorized to delete this image or storageId is missing.'
      );
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this image? This action cannot be undone.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteImageMutation({ imageId, storageId });
      toast.success('Image deleted successfully.');
    } catch (error) {
      toast.error('Failed to delete image.');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRepost = async () => {
    if (!currentUserId) {
      toast.error('You must be logged in to repost.');
      return;
    }

    // For reposts, use the original image ID
    const targetImageId =
      isRepost && originalImageId ? originalImageId : imageId;

    setIsReposting(true);
    try {
      await repostImageMutation({
        originalImageId: targetImageId,
        repostComment: repostCommentText.trim() || undefined,
      });
      toast.success('Post republié sur votre profil!');
      setShowRepostDialog(false);
      setRepostCommentText('');
    } catch (error) {
      toast.error((error as Error).message);
      console.error('Error reposting:', error);
    } finally {
      setIsReposting(false);
    }
  };

  if (!imageUrl) return null;

  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="mobile-card-padding sm:p-4 border-b border-border flex items-center gap-2 sm:gap-3">
        {displayUploaderProfileImageUrl ? (
          <img
            src={displayUploaderProfileImageUrl}
            alt={displayUploaderName}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 sm:w-6 sm:h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base sm:text-lg text-card-foreground truncate">
            {displayTitle}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            Par {displayUploaderName}
          </p>
        </div>
      </div>

      {/* Repost indicator */}
      {isRepost && (
        <div className="mobile-card-padding sm:px-4 sm:py-2 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22-.032-.441.046-.662M4.5 12l3 3m-3-3 3-3"
              />
            </svg>
            <span className="truncate">Republié de</span>
            {displayOriginalUploaderProfileImageUrl ? (
              <img
                src={displayOriginalUploaderProfileImageUrl}
                alt={displayOriginalUploader || 'Original uploader'}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-border flex-shrink-0"
              />
            ) : (
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-2 h-2 sm:w-3 sm:h-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </div>
            )}
            <span className="font-medium truncate">
              {displayOriginalUploader}
            </span>
          </div>
          {repostComment && (
            <p className="mt-1 text-xs sm:text-sm text-card-foreground">
              {repostComment}
            </p>
          )}
        </div>
      )}

      {/* Image with transparent background */}
      <div className="image-container bg-background">
        <img
          src={imageUrl}
          alt={displayTitle}
          className="w-full h-auto max-h-[70vh] object-contain"
        />
      </div>

      {/* Content */}
      <div className="mobile-card-padding sm:p-4 space-y-2 sm:space-y-3">
        {displayDescription && (
          <p className="text-card-foreground text-xs sm:text-sm">
            {displayDescription}
          </p>
        )}
        {(displayContact || displayLocation) && (
          <div className="text-xs text-muted-foreground space-y-1">
            {displayContact && (
              <p className="truncate">Contact: {displayContact}</p>
            )}
            {displayLocation && (
              <p className="truncate">Lieu: {displayLocation}</p>
            )}
          </div>
        )}
        <div className="flex justify-between items-center gap-2">
          <div className="action-buttons">
            <button
              onClick={handleLikeToggle}
              disabled={!currentUserId}
              className={`action-button like-button-disabled min-h-[36px] sm:min-h-[40px]
                ${hasLiked ? 'like-button-liked' : 'like-button-unliked'}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
              </svg>
              <span>{currentLikes.length}</span>
            </button>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                />
              </svg>
              <span>{displayCommentCount}</span>
            </div>

            {currentUserId && imageOwnerId !== currentUserId && (
              <button
                onClick={() => setShowRepostDialog(true)}
                className="action-button button-secondary min-h-[36px] sm:min-h-[40px]"
                title="Republier"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22-.032-.441.046-.662M4.5 12l3 3m-3-3 3-3"
                  />
                </svg>
                <span className="hidden sm:inline">Republier</span>
              </button>
            )}
          </div>
          {allowDelete && currentUserId && imageOwnerId === currentUserId && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="delete-button min-h-[36px] sm:min-h-[40px]"
              title="Supprimer"
            >
              {isDeleting ? (
                '...'
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09.992-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
        <CommentSection imageId={imageId} currentUserId={currentUserId} />
      </div>

      {/* Repost Dialog */}
      {showRepostDialog && (
        <div className="modal-container">
          <div className="modal-content">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">
              Republier cette image
            </h3>
            <textarea
              value={repostCommentText}
              onChange={(e) => setRepostCommentText(e.target.value)}
              placeholder="Ajouter un commentaire (optionnel)..."
              className="auth-input-field w-full h-16 sm:h-20 mb-3 sm:mb-4 resize-none"
              disabled={isReposting}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRepostDialog(false)}
                className="button button-secondary"
                disabled={isReposting}
              >
                Annuler
              </button>
              <button
                onClick={handleRepost}
                className="button button-primary"
                disabled={isReposting}
              >
                {isReposting ? 'Republication...' : 'Republier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
