import { useState, FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";

interface CommentSectionProps {
  imageId: Id<"images">;
  currentUserId?: Id<"users"> | null;
}

const INITIAL_VISIBLE_COMMENTS = 2;

export function CommentSection({ imageId, currentUserId }: CommentSectionProps) {
  const comments = useQuery(api.comments.listByImage, { imageId });
  const addComment = useMutation(api.comments.add);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const handleSubmitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUserId) {
      toast.error("You must be logged in to comment.");
      return;
    }
    if (!newCommentText.trim()) {
      toast.info("Comment cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addComment({ imageId, text: newCommentText });
      setNewCommentText("");
      toast.success("Commentaire ajouté!");
    } catch (error) {
      toast.error("Failed to add comment. " + (error as Error).message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleComments = comments
    ? showAllComments
      ? comments
      : comments.slice(0, INITIAL_VISIBLE_COMMENTS)
    : [];

  return (
    <div className="comment-container">
      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
        {comments === undefined && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Chargement des commentaires...
          </p>
        )}
        {comments && comments.length === 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Aucun commentaire pour le moment.
          </p>
        )}
        {visibleComments.map((comment) => (
          <div key={comment._id} className="comment-item">
            {comment.commenterProfileImageUrl ? (
              <img
                src={comment.commenterProfileImageUrl}
                alt={comment.commenterName}
                className="comment-avatar"
              />
            ) : (
              <div className="comment-avatar bg-muted flex items-center justify-center text-muted-foreground border border-border">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3"
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
              <span className="font-semibold text-card-foreground">
                {comment.commenterName}:{" "}
              </span>
              <span className="text-muted-foreground break-words">{comment.text}</span>
            </div>
          </div>
        ))}
      </div>

      {comments && comments.length > INITIAL_VISIBLE_COMMENTS && (
        <button
          onClick={() => setShowAllComments(!showAllComments)}
          className="text-xs sm:text-sm text-primary hover:underline mb-2 sm:mb-3 focus-visible"
        >
          {showAllComments
            ? "Afficher moins de commentaires"
            : `Voir les ${comments.length - INITIAL_VISIBLE_COMMENTS} autres commentaires`}
        </button>
      )}

      {currentUserId && (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="comment-input"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="comment-submit"
            disabled={isSubmitting || !newCommentText.trim()}
          >
            {isSubmitting ? "..." : "Envoyer"}
          </button>
        </form>
      )}
    </div>
  );
}
