import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ImageCard, ImageCardData } from "./ImageCard";
import { Id } from "../convex/_generated/dataModel";

interface SingleImageViewPageProps {
  imageId: Id<"images">;
}

export function SingleImageViewPage({ imageId }: SingleImageViewPageProps) {
  const image = useQuery(api.images.getImage, { imageId }) as ImageCardData | null | undefined;
  const currentUser = useQuery(api.auth.loggedInUser);

  if (image === undefined || currentUser === undefined) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (image === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-center text-muted-foreground text-lg">Image not found.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {image.url && (
        <ImageCard
          image={image}
          currentUserId={currentUser?._id}
          allowDelete={currentUser?._id === image.userId}
        />
      )}
    </div>
  );
}
