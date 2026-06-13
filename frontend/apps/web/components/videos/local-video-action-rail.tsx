"use client";

import { Heart, MessageCircle, Share2 } from "lucide-react";

type LocalVideoActionRailProps = {
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  likeAnimating?: boolean;
  onLikeClick: () => void;
  onCommentsClick: () => void;
  onShareClick: () => void;
};

export function LocalVideoActionRail({
  likeCount,
  commentCount,
  likedByMe,
  likeAnimating = false,
  onLikeClick,
  onCommentsClick,
  onShareClick,
}: LocalVideoActionRailProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={onLikeClick}
        aria-label={likedByMe ? "Retirer le like" : "Aimer la vidéo"}
        aria-pressed={likedByMe}
        className={`flex min-h-11 min-w-11 flex-col items-center gap-1 transition-transform duration-200 ${
          likedByMe ? "text-rose-400" : "text-white"
        } ${likeAnimating ? "scale-125" : "scale-100"}`}
      >
        <Heart
          className={`h-7 w-7 ${likedByMe ? "fill-current" : ""}`}
          aria-hidden
        />
        <span className="text-xs tabular-nums">{likeCount}</span>
      </button>
      <button
        type="button"
        onClick={onCommentsClick}
        aria-label="Ouvrir les commentaires"
        className="flex min-h-11 min-w-11 flex-col items-center gap-1 text-white"
      >
        <MessageCircle className="h-7 w-7" aria-hidden />
        <span className="text-xs tabular-nums">{commentCount}</span>
      </button>
      <button
        type="button"
        onClick={onShareClick}
        aria-label="Partager la vidéo"
        className="flex min-h-11 min-w-11 flex-col items-center gap-1 text-white"
      >
        <Share2 className="h-7 w-7" aria-hidden />
        <span className="sr-only">Partager</span>
      </button>
    </div>
  );
}
