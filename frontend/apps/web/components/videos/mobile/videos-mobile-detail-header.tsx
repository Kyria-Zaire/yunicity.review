"use client";

import {
  VIDEO_DETAIL_MOBILE_BOOKMARK_SOON,
  VIDEO_DETAIL_MORE,
} from "@yunicity/utils";
import { ArrowLeft, Bookmark, MoreVertical } from "lucide-react";
import Link from "next/link";

import { VIDEO_CANVAS_FOCUS, VIDEO_TOUCH_TARGET } from "@/lib/videos/video-playback-a11y";

type VideosMobileDetailHeaderProps = {
  onOpenReport: () => void;
  /** Medium détail : le retour texte est déjà affiché au-dessus — masquer le second lien. */
  showBackLink?: boolean;
};

/** Header page détail vidéo mobile — retour · bookmark · menu (MOBILE-VIDEOS-02). */
export function VideosMobileDetailHeader({
  onOpenReport,
  showBackLink = true,
}: VideosMobileDetailHeaderProps) {
  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        {showBackLink ? (
          <Link
            href="/videos"
            className={`${VIDEO_TOUCH_TARGET} rounded-full text-neutral-800 transition hover:bg-neutral-100 ${VIDEO_CANVAS_FOCUS}`}
            aria-label="Retour aux vidéos"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </Link>
        ) : (
          <span className={`${VIDEO_TOUCH_TARGET} shrink-0`} aria-hidden />
        )}

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            disabled
            title={VIDEO_DETAIL_MOBILE_BOOKMARK_SOON}
            aria-label={VIDEO_DETAIL_MOBILE_BOOKMARK_SOON}
            className={`${VIDEO_TOUCH_TARGET} rounded-full text-yunicity-primary opacity-45 ${VIDEO_CANVAS_FOCUS}`}
          >
            <Bookmark className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onOpenReport}
            className={`${VIDEO_TOUCH_TARGET} rounded-full text-neutral-700 transition hover:bg-neutral-100 ${VIDEO_CANVAS_FOCUS}`}
            aria-label={VIDEO_DETAIL_MORE}
          >
            <MoreVertical className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
