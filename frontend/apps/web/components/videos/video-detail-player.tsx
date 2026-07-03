"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  VIDEO_DETAIL_MORE,
  VIDEO_DETAIL_NEW_BADGE,
  isVideoDetailNew,
} from "@yunicity/utils";
import { MoreVertical } from "lucide-react";
import { useRef } from "react";

type VideoDetailPlayerProps = {
  item: LocalVideoFeedItem;
  onOpenReport: () => void;
  onEnded?: () => void;
};

export function VideoDetailPlayer({ item, onOpenReport, onEnded }: VideoDetailPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-neutral-950 shadow-md ring-1 ring-neutral-200/80">
      <video
        ref={videoRef}
        src={item.media_url}
        poster={item.thumbnail_url}
        controls
        playsInline
        className="aspect-video w-full bg-black object-contain"
        onEnded={onEnded}
      />

      {isVideoDetailNew(item) ? (
        <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-yunicity-primary px-3 py-1 text-xs font-semibold text-white">
          {VIDEO_DETAIL_NEW_BADGE}
        </span>
      ) : null}

      <button
        type="button"
        onClick={onOpenReport}
        className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950/55 text-white backdrop-blur-sm transition hover:bg-neutral-950/75"
        aria-label={VIDEO_DETAIL_MORE}
      >
        <MoreVertical className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
