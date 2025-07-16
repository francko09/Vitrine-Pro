import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ImageCard, ImageCardData } from "./ImageCard";
import { Doc, Id } from "../convex/_generated/dataModel";

type UserImage = Doc<"images"> & { 
  url: string | null; 
  commentCount: number; 
  shareCount: number;
  originalUploader?: string | null;
  originalUploaderProfileImageUrl?: string | null;
};

export function MyPhotosPage() {
  const images = useQuery(api.images.listUserImages) as UserImage[] | undefined;
  const currentUser = useQuery(api.auth.loggedInUser);
  const currentUserProfileImageUrl = useQuery(api.userProfiles.getCurrentUserProfileImageUrl);


  if (images === undefined || currentUser === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (images.length === 0) {
    return <p className="text-center text-muted-foreground text-lg">Il n'y a pas de service pubié pour le moment </p>;
  }

  return (
    <div className="space-y-8">
      {images.map((image) => (
        image.url && (
          <ImageCard 
            key={image._id} 
            image={{
              ...image,
              uploader: currentUser?.name ?? currentUser?.email ?? "You",
              uploaderProfileImageUrl: currentUserProfileImageUrl, 
              commentCount: image.commentCount ?? 0,
              shareCount: image.shareCount ?? 0,
            } as ImageCardData}
            currentUserId={currentUser?._id}
            allowDelete={true}
          />
        )
      ))}
    </div>
  );
}
