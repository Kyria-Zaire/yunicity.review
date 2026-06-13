"use client";

import { Heart, MessageCircle, Share2 } from "lucide-react";

type LocalVideoActionRailProps = {
  likeCount: number;
  commentCount: number;
  onCommentsClick: () => void;
};

export function LocalVideoActionRail({
  likeCount,
  commentCount,
  onCommentsClick,
}: LocalVideoActionRailProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Bientôt disponible"
        className="flex min-h-11 min-w-11 flex-col items-center gap-1 text-white/70"
      >
        <Heart className="h-7 w-7" aria-hidden />
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
        disabled
        aria-disabled="true"
        title="Bientôt disponible"
        className="flex min-h-11 min-w-11 flex-col items-center gap-1 text-white/70"
      >
        <Share2 className="h-7 w-7" aria-hidden />
        <span className="sr-only">Partager</span>
      </button>
    </div>
  );
}
