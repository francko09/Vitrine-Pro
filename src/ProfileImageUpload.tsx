import { useState, ChangeEvent, FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface ProfileImageUploadProps {
  onClose: () => void;
  currentImageUrl: string | null | undefined;
}

export function ProfileImageUpload({ onClose, currentImageUrl }: ProfileImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const generateUploadUrl = useMutation(api.userProfiles.generateProfileImageUploadUrl);
  const setProfileImage = useMutation(api.userProfiles.setProfileImage);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        toast.error("Please select an image file.");
        setSelectedImage(null);
        setPreviewUrl(currentImageUrl || null);
      }
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedImage) {
      toast.error("Please select an image to upload.");
      return;
    }

    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage.type },
        body: selectedImage,
      });
      const json = await result.json();
      if (!result.ok) {
        throw new Error(`Upload failed: ${JSON.stringify(json)}`);
      }
      const { storageId } = json;
      await setProfileImage({ storageId });
      toast.success("Profile image updated successfully!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile image. " + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-container">
      <div className="modal-content">
        <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-3 sm:mb-4">Changer de photo de profile</h2>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="flex flex-col items-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Profile preview" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover mb-3 sm:mb-4 border border-border" />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3 sm:mb-4 border border-border">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 sm:w-12 sm:h-12">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="auth-input-field text-xs sm:text-sm file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover"
              id="profileImageInput"
              disabled={isUploading}
            />
            <label htmlFor="profileImageInput" className="mt-2 text-xs sm:text-sm text-primary cursor-pointer hover:underline text-center">
              {selectedImage ? `Selected: ${selectedImage.name}` : "Choose an image"}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="button button-secondary"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={!selectedImage || isUploading}
            >
              {isUploading ? "Uploading..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
