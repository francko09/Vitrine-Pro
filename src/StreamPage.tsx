import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ImageCard, ImageCardData } from "./ImageCard";
import { SearchBar } from "./SearchBar";
import { Doc, Id } from "../convex/_generated/dataModel";

type StreamImage = Doc<"images"> & { 
  url: string | null; 
  uploader: string; 
  uploaderProfileImageUrl?: string | null; 
  commentCount: number; 
  shareCount: number;
  originalUploader?: string | null;
  originalUploaderProfileImageUrl?: string | null;
};

export function StreamPage() {
  const allImages = useQuery(api.images.listGlobalImages) as StreamImage[] | undefined;
  const currentUser = useQuery(api.auth.loggedInUser);
  const [searchResults, setSearchResults] = useState<StreamImage[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchResults = (results: StreamImage[]) => {
    setSearchResults(results);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchResults(null);
    setIsSearching(false);
  };

  if (allImages === undefined || currentUser === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const imagesToDisplay = isSearching ? (searchResults || []) : allImages;

  return (
    <div className="card-spacing">
      <SearchBar 
        onSearchResults={handleSearchResults}
        onClearSearch={handleClearSearch}
      />
      
      {isSearching && searchResults && searchResults.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-3 sm:mb-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <p className="text-center text-muted-foreground text-base sm:text-lg">
            Aucune image trouvée pour cette recherche.
          </p>
          <p className="text-center text-muted-foreground text-xs sm:text-sm mt-2">
            Essayez avec d'autres mots-clés.
          </p>
        </div>
      )}

      {!isSearching && imagesToDisplay.length === 0 && (
        <p className="text-center text-muted-foreground text-base sm:text-lg">
          No images in the stream yet. Be the first to upload!
        </p>
      )}

      {imagesToDisplay.map((image) => (
        image.url && (
          <ImageCard 
            key={image._id} 
            image={image as ImageCardData} 
            currentUserId={currentUser?._id}
            allowDelete={currentUser?._id === image.userId} 
          />
        )
      ))}
    </div>
  );
}
