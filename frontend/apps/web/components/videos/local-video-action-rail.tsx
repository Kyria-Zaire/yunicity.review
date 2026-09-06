"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_REPORT_LABEL,
  VIDEO_DETAIL_MOBILE_BOOKMARK_SOON,
  VIDEOS_DESKTOP_SAVE,
  VIDEOS_DESKTOP_SHARE,
  buildVideoAuthorProfileHref,
} from "@yunicity/utils";
import { Bookmark, Flag, Heart, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";

import { VIDEO_IMMERSIVE_FOCUS, VIDEO_TOUCH_TARGET } from "@/lib/videos/video-playback-a11y";

type LocalVideoActionRailProps = {
  item: LocalVideoFeedItem;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  likeAnimating?: boolean;
  onLikeClick: () => void;
  onCommentsClick: () => void;
  onShareClick: () => void;
  onReportClick: () => void;
};

function authorInitials(item: LocalVideoFeedItem): string {
  const name = item.author.full_name?.trim() || item.author.username || "YU";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const railButtonClass = `${VIDEO_TOUCH_TARGET} flex-col gap-1 ${VIDEO_IMMERSIVE_FOCUS}`;

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
  onReportClick,
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
        <Link
          href={profileHref}
          className={`${VIDEO_TOUCH_TARGET} shrink-0 ${VIDEO_IMMERSIVE_FOCUS}`}
          aria-label="Profil du créateur"
        >
          {avatar}
        </Link>
      ) : (
        <span className={`${VIDEO_TOUCH_TARGET} shrink-0`}>{avatar}</span>
      )}

      <button
        type="button"
        onClick={onLikeClick}
        aria-label={likedByMe ? "Retirer le like" : "Aimer la vidéo"}
        aria-pressed={likedByMe}
        className={`${railButtonClass} transition-transform duration-200 motion-reduce:transition-none ${
          likedByMe ? "text-rose-400" : "text-white"
        } ${likeAnimating ? "scale-110 motion-reduce:scale-100" : "scale-100"}`}
      >
        <Heart className={`h-5 w-5 ${likedByMe ? "fill-current" : ""}`} aria-hidden />
        <span className="text-[10px] font-semibold tabular-nums leading-none">{likeCount}</span>
      </button>

      <button
        type="button"
        onClick={onCommentsClick}
        aria-label="Ouvrir les commentaires"
        className={`${railButtonClass} text-white`}
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        <span className="text-[10px] font-semibold tabular-nums leading-none">{commentCount}</span>
      </button>

      <button
        type="button"
        onClick={onShareClick}
        aria-label={VIDEOS_DESKTOP_SHARE}
        className={`${railButtonClass} text-white`}
      >
        <Share2 className="h-5 w-5" aria-hidden />
        <span className="text-[10px] font-semibold leading-none">{VIDEOS_DESKTOP_SHARE}</span>
      </button>

      <button
        type="button"
        onClick={onReportClick}
        aria-label={LOCAL_VIDEO_REPORT_LABEL}
        className={`${railButtonClass} text-white`}
      >
        <Flag className="h-5 w-5" aria-hidden />
        <span className="text-[10px] font-semibold leading-none">{LOCAL_VIDEO_REPORT_LABEL}</span>
      </button>

      <button
        type="button"
        disabled
        aria-label={VIDEO_DETAIL_MOBILE_BOOKMARK_SOON}
        className={`${railButtonClass} text-white/75`}
      >
        <Bookmark className="h-5 w-5" aria-hidden />
        <span className="text-[10px] font-semibold leading-none">{VIDEOS_DESKTOP_SAVE}</span>
      </button>
    </div>
  );
}
