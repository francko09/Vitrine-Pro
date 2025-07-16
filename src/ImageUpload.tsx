import { useState, DragEvent, ChangeEvent, FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface ImageUploadProps {
  onSuccess?: () => void;
}

export function ImageUpload({ onSuccess }: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const createImage = useMutation(api.images.createImage);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
    } else {
      setSelectedImage(null);
      if (file) toast.error("Please select an image file.");
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFileChange(event.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      handleFileChange(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedImage) {
      toast.error("Please select an image to upload.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title for your image.");
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
      await createImage({ 
        storageId, 
        title,
        description: description.trim() || undefined,
        contact: contact.trim() || undefined,
        location: location.trim() || undefined,
      });
      toast.success("Image published successfully!");
      setSelectedImage(null);
      setTitle("");
      setDescription("");
      setContact("");
      setLocation("");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Failed to publish image. " + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Publier une image</h2>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`w-full h-48 sm:h-64 border-2 border-dashed rounded-lg flex flex-col justify-center items-center cursor-pointer transition-colors
            ${dragOver ? "upload-area-dragover" : "border-input"}
            ${selectedImage ? "upload-area-selected" : "upload-area-default"}`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            id="fileInput"
            disabled={isUploading}
          />
          <label htmlFor="fileInput" className="w-full h-full flex flex-col justify-center items-center cursor-pointer p-4">
            {selectedImage ? (
              <div className="text-center">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Preview"
                  className="max-h-32 sm:max-h-40 rounded-md mb-2 mx-auto"
                />
                <p className="text-card-foreground font-medium text-sm sm:text-base truncate max-w-full">{selectedImage.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Cliquez ou glissez pour changer</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338 2.166c1.551.323 2.874 1.268 3.618 2.504A4.501 4.501 0 0 1 18 19.5H6.75Z" />
                </svg>
                <p className="font-semibold text-sm sm:text-base">Glissez et déposez une image ici</p>
                <p className="text-xs sm:text-sm">ou cliquez pour sélectionner un fichier</p>
              </div>
            )}
          </label>
        </div>

        <div>
          <label htmlFor="title" className="block text-xs sm:text-sm font-medium text-card-foreground mb-1">Titre *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="auth-input-field"
            required
            disabled={isUploading}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-card-foreground mb-1">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="auth-input-field resize-none"
            disabled={isUploading}
          />
        </div>

        <div>
          <label htmlFor="contact" className="block text-xs sm:text-sm font-medium text-card-foreground mb-1">Contact (email, téléphone, etc.)</label>
          <input
            type="text"
            id="contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="auth-input-field"
            disabled={isUploading}
          />
        </div>
        
        <div>
          <label htmlFor="location" className="block text-xs sm:text-sm font-medium text-card-foreground mb-1">Localisation</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="auth-input-field"
            disabled={isUploading}
          />
        </div>

        <button
          type="submit"
          disabled={!selectedImage || isUploading || !title.trim()}
          className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {isUploading ? "Publication en cours..." : "Publier"}
        </button>
      </form>
    </div>
  );
}
