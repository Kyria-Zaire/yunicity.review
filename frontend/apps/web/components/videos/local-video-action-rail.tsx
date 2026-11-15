"use client";

import {
  VIDEOS_MOBILE_MORE_ACTIONS,
  VIDEOS_MOBILE_SHARE_ACTION,
  VIDEOS_MOBILE_SHARE_SHORT,
  formatVideosMobileCommentsActionLabel,
  formatVideosMobileLikeActionLabel,
} from "@yunicity/utils";
import { Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";

import { VIDEO_IMMERSIVE_FOCUS } from "@/lib/videos/video-playback-a11y";

type LocalVideoActionRailProps = {
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  likeAnimating?: boolean;
  /**
   * `overlay` : pastille voilée sur la vidéo (mobile A).
   * `stage` : à côté d'une vidéo paysage mobile (D).
   * `side` : colonne medium v1.2 hors vidéo (pastilles claires) — ≠ panneau R-PAN.
   */
  surface?: "overlay" | "stage" | "side";
  onLikeClick: () => void;
  onCommentsClick: () => void;
  onShareClick: () => void;
  /** Reçoit le bouton « … » : cible explicite du retour du focus à la fermeture du menu. */
  onMoreClick: (trigger: HTMLElement) => void;
};

/**
 * Colonne d'actions : J'aime, Commentaires, Partager, « … ».
 * Suivre et Enregistrer absents (L1) ; Signaler dans « … ».
 */
export function LocalVideoActionRail({
  likeCount,
  commentCount,
  likedByMe,
  likeAnimating = false,
  surface = "overlay",
  onLikeClick,
  onCommentsClick,
  onShareClick,
  onMoreClick,
}: LocalVideoActionRailProps) {
  const side = surface === "side";
  const shellClass = side
    ? "gap-3 bg-transparent py-0"
    : surface === "overlay"
      ? "rounded-[29px] bg-[rgba(17,24,39,0.6)] py-1.5"
      : "rounded-[29px] bg-white/[0.08] py-1.5";
  const ink = side ? "text-neutral-800" : "text-white";
  const pill = side
    ? "flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-900"
    : "";
  const actionButtonClass = side
    ? `flex flex-col items-center gap-1 ${ink} ${VIDEO_IMMERSIVE_FOCUS}`
    : `flex h-[58px] w-[58px] flex-col items-center justify-center gap-0.5 text-white ${VIDEO_IMMERSIVE_FOCUS}`;

  return (
    <div
      className={`local-video-action-rail pointer-events-auto flex w-[58px] flex-col items-center ${shellClass}`}
      data-videos-action-surface={surface}
    >
      <button
        type="button"
        onClick={onLikeClick}
        aria-label={formatVideosMobileLikeActionLabel(likedByMe, likeCount)}
        aria-pressed={likedByMe}
        className={`${actionButtonClass} transition-transform duration-200 motion-reduce:transition-none ${
          likeAnimating ? "scale-110 motion-reduce:scale-100" : "scale-100"
        }`}
      >
        <span className={pill || undefined}>
          <Heart
            className={`${side ? "h-[22px] w-[22px]" : "h-[26px] w-[26px]"} ${
              likedByMe ? "fill-rose-400 text-rose-400" : ""
            }`}
            strokeWidth={2}
            aria-hidden
          />
        </span>
        <span className="text-xs font-semibold tabular-nums leading-none">{likeCount}</span>
      </button>

      <button
        type="button"
        onClick={onCommentsClick}
        aria-label={formatVideosMobileCommentsActionLabel(commentCount)}
        className={actionButtonClass}
      >
        <span className={pill || undefined}>
          <MessageCircle className={side ? "h-[22px] w-[22px]" : "h-[26px] w-[26px]"} strokeWidth={2} aria-hidden />
        </span>
        <span className="text-xs font-semibold tabular-nums leading-none">{commentCount}</span>
      </button>

      <button type="button" onClick={onShareClick} aria-label={VIDEOS_MOBILE_SHARE_ACTION} className={actionButtonClass}>
        <span className={pill || undefined}>
          <Send className={side ? "h-[22px] w-[22px]" : "h-[26px] w-[26px]"} strokeWidth={2} aria-hidden />
        </span>
        <span className={`${side ? "text-[12px]" : "text-[11px]"} font-semibold leading-none`}>
          {VIDEOS_MOBILE_SHARE_SHORT}
        </span>
      </button>

      <button
        type="button"
        onClick={(event) => onMoreClick(event.currentTarget)}
        aria-label={VIDEOS_MOBILE_MORE_ACTIONS}
        aria-haspopup="dialog"
        className={
          side
            ? `flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 ${VIDEO_IMMERSIVE_FOCUS}`
            : `flex h-11 w-[58px] items-center justify-center text-white ${VIDEO_IMMERSIVE_FOCUS}`
        }
      >
        <MoreHorizontal className={side ? "h-[22px] w-[22px]" : "h-6 w-6"} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}