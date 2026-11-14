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
  /** `overlay` : sur la vidéo (pastille voilée, écran A) ; `stage` : à côté d'une vidéo paysage (écran D). */
  surface?: "overlay" | "stage";
  onLikeClick: () => void;
  onCommentsClick: () => void;
  onShareClick: () => void;
  /** Reçoit le bouton « … » : cible explicite du retour du focus à la fermeture du menu. */
  onMoreClick: (trigger: HTMLElement) => void;
};

const actionButtonClass = `flex h-[58px] w-[58px] flex-col items-center justify-center gap-0.5 text-white ${VIDEO_IMMERSIVE_FOCUS}`;

/**
 * Colonne d'actions mobile v2.3 (écrans A et D) : J'aime, Commentaires, Partager, « … ».
 * Pastille de 58 px ; voile 60 % sur la vidéo. Suivre et Enregistrer n'existent pas
 * (VIDEO-REFONTE-L1) ; Signaler est rangé dans « … » (écran I).
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
  return (
    <div
      className={`local-video-action-rail pointer-events-auto flex w-[58px] flex-col items-center rounded-[29px] py-1.5 ${
        surface === "overlay" ? "bg-[rgba(17,24,39,0.6)]" : "bg-white/[0.08]"
      }`}
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
        <Heart className={`h-[26px] w-[26px] ${likedByMe ? "fill-rose-400 text-rose-400" : ""}`} strokeWidth={2} aria-hidden />
        <span className="text-xs font-semibold tabular-nums leading-none">{likeCount}</span>
      </button>

      <button
        type="button"
        onClick={onCommentsClick}
        aria-label={formatVideosMobileCommentsActionLabel(commentCount)}
        className={actionButtonClass}
      >
        <MessageCircle className="h-[26px] w-[26px]" strokeWidth={2} aria-hidden />
        <span className="text-xs font-semibold tabular-nums leading-none">{commentCount}</span>
      </button>

      <button type="button" onClick={onShareClick} aria-label={VIDEOS_MOBILE_SHARE_ACTION} className={actionButtonClass}>
        <Send className="h-[26px] w-[26px]" strokeWidth={2} aria-hidden />
        <span className="text-[11px] font-semibold leading-none">{VIDEOS_MOBILE_SHARE_SHORT}</span>
      </button>

      <button
        type="button"
        onClick={(event) => onMoreClick(event.currentTarget)}
        aria-label={VIDEOS_MOBILE_MORE_ACTIONS}
        aria-haspopup="dialog"
        className={`flex h-11 w-[58px] items-center justify-center text-white ${VIDEO_IMMERSIVE_FOCUS}`}
      >
        <MoreHorizontal className="h-6 w-6" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
