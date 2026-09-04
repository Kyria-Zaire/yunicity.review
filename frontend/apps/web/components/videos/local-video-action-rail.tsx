"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  VIDEOS_DESKTOP_SAVE,
  VIDEOS_DESKTOP_SHARE,
  buildVideoAuthorProfileHref,
} from "@yunicity/utils";
import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";

type LocalVideoActionRailProps = {
  item: LocalVideoFeedItem;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  likeAnimating?: boolean;
  onLikeClick: () => void;
  onCommentsClick: () => void;
  onShareClick: () => void;
};

function authorInitials(item: LocalVideoFeedItem): string {
  const name = item.author.full_name?.trim() || item.author.username || "YU";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Colonne d'actions droite — avatar, like, commentaire, partage, enregistrer. */
export function LocalVideoActionRail({
  item,
  likeCount,
  commentCount,
  likedByMe,
  likeAnimating = false,
  onLikeClick,
  onCommentsClick,
  onShareClick,
}: LocalVideoActionRailProps) {
  const profileHref = buildVideoAuthorProfileHref(item);

  const avatar = item.author.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.author.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-white/80" />
  ) : (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yunicity-primary text-[10px] font-bold text-white ring-2 ring-white/80">
      {authorInitials(item)}
    </span>
  );

  return (
    <div className="local-video-action-rail pointer-events-auto flex flex-col items-center gap-5 pb-1 pt-0.5">
      {profileHref ? (
        <Link href={profileHref} className="shrink-0" aria-label="Profil du créateur">
          {avatar}
        </Link>
      ) : (
        avatar
      )}

      <button
        type="button"
        onClick={onLikeClick}
        aria-label={likedByMe ? "Retirer le like" : "Aimer la vidéo"}
        aria-pressed={likedByMe}
        className={`flex min-h-9 min-w-9 flex-col items-center gap-1 transition-transform duration-200 ${
          likedByMe ? "text-rose-400" : "text-white"
        } ${likeAnimating ? "scale-110" : "scale-100"}`}
      >
        <Heart className={`h-5 w-5 ${likedByMe ? "fill-current" : ""}`} aria-hidden />
        <span className="text-[10px] font-semibold tabular-nums leading-none">{likeCount}</span>
      </button>

      <button
        type="button"
        onClick={onCommentsClick}
        aria-label="Ouvrir les commentaires"
        className="flex min-h-9 min-w-9 flex-col items-center gap-1 text-white"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        <span className="text-[10px] font-semibold tabular-nums leading-none">{commentCount}</span>
      </button>

      <button
        type="button"
        onClick={onShareClick}
        aria-label={VIDEOS_DESKTOP_SHARE}
        className="flex min-h-9 min-w-9 flex-col items-center gap-1 text-white"
      >
        <Share2 className="h-5 w-5" aria-hidden />
        <span className="text-[10px] font-semibold leading-none">{VIDEOS_DESKTOP_SHARE}</span>
      </button>

      <span
        aria-label={VIDEOS_DESKTOP_SAVE}
        className="flex min-h-9 min-w-9 flex-col items-center gap-1 text-white/75"
      >
        <Bookmark className="h-5 w-5" aria-hidden />
        <span className="text-[10px] font-semibold leading-none">{VIDEOS_DESKTOP_SAVE}</span>
      </span>
    </div>
  );
}
