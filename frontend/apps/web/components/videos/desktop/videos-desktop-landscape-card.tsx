"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_REPORT_LABEL,
  VIDEOS_GRID_MORE,
  VIDEO_DETAIL_COMMENT,
  VIDEO_DETAIL_LIKE,
  VIDEO_DETAIL_SHARE,
  buildLocalVideoTeaserHref,
  buildVideoAuthorProfileHref,
  bumpLocalVideoCommentCount,
  formatVideoAuthorHandle,
  formatVideoTemporalLabel,
  resolveLocalVideoTeaserTitle,
} from "@yunicity/utils";
import { Heart, MessageCircle, MoreVertical, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LocalVideoReportSheet } from "@/components/videos/local-video-report-sheet";
import { VideoCommentsSheet } from "@/components/videos/video-comments-sheet";
import { VideosStreamMediaFrame } from "@/components/videos/videos-stream-media-frame";
import { useLocalVideoInteractions } from "@/hooks/use-local-video-interactions";

type VideosDesktopLandscapeCardProps = {
  item: LocalVideoFeedItem;
};

export function VideosDesktopLandscapeCard({ item: initialItem }: VideosDesktopLandscapeCardProps) {
  const [item, setItem] = useState(initialItem);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItem(initialItem);
  }, [initialItem]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  const interactions = useLocalVideoInteractions({
    updateItem: (_videoId, updater) => {
      setItem((current) => updater(current));
    },
  });

  const title = resolveLocalVideoTeaserTitle(item);
  const href = buildLocalVideoTeaserHref(item.id);
  const profileHref = buildVideoAuthorProfileHref(item);
  const handle = formatVideoAuthorHandle(item);

  return (
    <article data-videos-desktop-landscape="" className="feed-desktop-surface overflow-hidden">
      <VideosStreamMediaFrame item={item} />

      <div className="space-y-2 px-5 py-4 sm:px-6">
        <Link href={href} className="block">
          <h3 className="text-base font-bold leading-snug text-neutral-900 hover:text-yunicity-primary">
            {title}
          </h3>
        </Link>

        {profileHref ? (
          <Link
            href={profileHref}
            className="inline-block text-sm font-medium text-neutral-500 transition hover:text-yunicity-primary"
          >
            {handle}
          </Link>
        ) : (
          <p className="text-sm font-medium text-neutral-500">{handle}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span>{formatVideoTemporalLabel(item.published_at)}</span>

          <button
            type="button"
            onClick={() => void interactions.toggleLike(item)}
            aria-pressed={item.liked_by_me}
            aria-label={VIDEO_DETAIL_LIKE}
            className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition hover:text-yunicity-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
              item.liked_by_me ? "text-yunicity-primary" : ""
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${item.liked_by_me ? "fill-current" : ""}`} aria-hidden />
            {item.like_count}
          </button>

          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            aria-label={VIDEO_DETAIL_COMMENT}
            className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition hover:text-yunicity-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            {item.comment_count}
          </button>

          <button
            type="button"
            onClick={() => void interactions.shareVideo(item)}
            aria-label={VIDEO_DETAIL_SHARE}
            className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition hover:text-yunicity-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">{VIDEO_DETAIL_SHARE}</span>
          </button>

          {interactions.shareHint ? (
            <span className="text-[11px] font-medium text-emerald-600" role="status">
              {interactions.shareHint}
            </span>
          ) : null}

          <div ref={menuRef} className="relative ml-auto">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={VIDEOS_GRID_MORE}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
            >
              <MoreVertical className="h-4 w-4" aria-hidden />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 min-w-[10rem] rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                >
                  {LOCAL_VIDEO_REPORT_LABEL}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <VideoCommentsSheet
        open={commentsOpen}
        video={item}
        onClose={() => setCommentsOpen(false)}
        onCommentCountDelta={(_videoId, delta) => {
          setItem((current) => bumpLocalVideoCommentCount(current, delta));
        }}
      />

      <LocalVideoReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        alreadyReported={interactions.hasReported(item.id)}
        errorMessage={interactions.reportError}
        onReport={async (reason) => {
          await interactions.reportVideo(item.id, reason);
        }}
      />
    </article>
  );
}
