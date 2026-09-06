"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_REPORT_LABEL,
  VIDEOS_DESKTOP_MORE,
  VIDEOS_DESKTOP_SAVE,
  VIDEOS_DESKTOP_VIEW_PROFILE,
  VIDEO_DETAIL_MOBILE_BOOKMARK_SOON,
  VIDEOS_DESKTOP_SEE_ON_MAP,
  VIDEOS_DESKTOP_SHARE,
  VIDEOS_GRID_MORE,
  VIDEO_DETAIL_COMMENT,
  VIDEO_DETAIL_LIKE,
  VIDEO_DETAIL_SHARE,
  buildLocalVideoTeaserHref,
  buildVideoAuthorProfileHref,
  buildVideosPortraitHashtags,
  bumpLocalVideoCommentCount,
  formatLocalVideoDuration,
  formatVideoAuthorDisplayName,
  formatVideoAuthorHandle,
  formatVideosPortraitOriginalSound,
  formatVideoTemporalLabel,
  resolveLocalVideoTeaserTitle,
  resolveVideosPortraitDiscoverCta,
  resolveVideosPortraitMapHref,
  resolveVideosPortraitPlaceLabel,
} from "@yunicity/utils";
import {
  Bookmark,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  MoreVertical,
  Music2,
  Play,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { VIDEO_CANVAS_FOCUS, VIDEO_TOUCH_TARGET } from "@/lib/videos/video-playback-a11y";

import { ProfileAvatar } from "@/components/profile-avatar";
import { LocalVideoReportSheet } from "@/components/videos/local-video-report-sheet";
import { VideoCommentsSheet } from "@/components/videos/video-comments-sheet";
import { VideosStreamMediaFrame } from "@/components/videos/videos-stream-media-frame";
import { useLocalVideoInteractions } from "@/hooks/use-local-video-interactions";

type VideosDesktopPortraitCardProps = {
  item: LocalVideoFeedItem;
  featured?: boolean;
};

function PortraitOverflowMenu({
  onReport,
  variant,
}: {
  onReport: () => void;
  variant: "light" | "dark";
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const isDark = variant === "dark";
  const Icon = isDark ? MoreHorizontal : MoreVertical;

  return (
    <div ref={menuRef} className="relative ml-auto shrink-0">
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={isDark ? VIDEOS_DESKTOP_MORE : VIDEOS_GRID_MORE}
        onClick={() => setMenuOpen((open) => !open)}
        className={`inline-flex items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
          isDark
            ? `${VIDEO_TOUCH_TARGET} text-neutral-300 hover:bg-white/10`
            : "min-h-11 min-w-11 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        }`}
      >
        <Icon className={isDark ? "h-5 w-5" : "h-4 w-4"} aria-hidden />
      </button>
      {menuOpen ? (
        <div
          role="menu"
          className={`absolute right-0 z-20 mt-1 min-w-[10rem] rounded-xl border py-1 shadow-lg ${
            isDark ? "border-neutral-700 bg-neutral-900" : "border-neutral-200 bg-white"
          }`}
        >
          <button
            type="button"
            role="menuitem"
            className={`block w-full px-3 py-2 text-left text-sm font-medium transition ${
              isDark ? "text-white hover:bg-white/10" : "text-neutral-800 hover:bg-neutral-50"
            }`}
            onClick={() => {
              setMenuOpen(false);
              onReport();
            }}
          >
            {LOCAL_VIDEO_REPORT_LABEL}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PortraitSimpleMetaActions({
  item,
  onToggleLike,
  onOpenComments,
  onShare,
  onReport,
  shareHint,
}: {
  item: LocalVideoFeedItem;
  onToggleLike: () => void;
  onOpenComments: () => void;
  onShare: () => void;
  onReport: () => void;
  shareHint: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
      <span>{formatVideoTemporalLabel(item.published_at)}</span>

      <button
        type="button"
        onClick={onToggleLike}
        aria-pressed={item.liked_by_me}
        aria-label={VIDEO_DETAIL_LIKE}
        className={`inline-flex min-h-11 min-w-11 items-center gap-1 rounded-md px-1 transition hover:text-yunicity-primary ${VIDEO_CANVAS_FOCUS} ${
          item.liked_by_me ? "text-yunicity-primary" : ""
        }`}
      >
        <Heart className={`h-3.5 w-3.5 ${item.liked_by_me ? "fill-current" : ""}`} aria-hidden />
        {item.like_count}
      </button>

      <button
        type="button"
        onClick={onOpenComments}
        aria-label={VIDEO_DETAIL_COMMENT}
        className={`inline-flex min-h-11 min-w-11 items-center gap-1 rounded-md px-1 transition hover:text-yunicity-primary ${VIDEO_CANVAS_FOCUS}`}
      >
        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        {item.comment_count}
      </button>

      <button
        type="button"
        onClick={onShare}
        aria-label={VIDEO_DETAIL_SHARE}
        className={`inline-flex min-h-11 min-w-11 items-center gap-1 rounded-md px-1 transition hover:text-yunicity-primary ${VIDEO_CANVAS_FOCUS}`}
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">{VIDEO_DETAIL_SHARE}</span>
      </button>

      <button
        type="button"
        disabled
        aria-label={VIDEO_DETAIL_MOBILE_BOOKMARK_SOON}
        className={`inline-flex min-h-11 min-w-11 items-center gap-1 rounded-md px-1 text-neutral-400 ${VIDEO_CANVAS_FOCUS}`}
      >
        <Bookmark className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">{VIDEOS_DESKTOP_SAVE}</span>
      </button>

      {shareHint ? (
        <span className="text-[11px] font-medium text-emerald-600" role="status">
          {shareHint}
        </span>
      ) : null}

      <PortraitOverflowMenu onReport={onReport} variant="light" />
    </div>
  );
}

export function VideosDesktopPortraitCard({
  item: initialItem,
  featured = false,
}: VideosDesktopPortraitCardProps) {
  const [item, setItem] = useState(initialItem);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    setItem(initialItem);
  }, [initialItem]);

  const interactions = useLocalVideoInteractions({
    updateItem: (_videoId, updater) => {
      setItem((current) => updater(current));
    },
  });

  const title = resolveLocalVideoTeaserTitle(item);
  const author = formatVideoAuthorDisplayName(item);
  const handle = formatVideoAuthorHandle(item);
  const href = buildLocalVideoTeaserHref(item.id);
  const profileHref = buildVideoAuthorProfileHref(item);
  const placeLabel = resolveVideosPortraitPlaceLabel(item);
  const hashtags = buildVideosPortraitHashtags(item);
  const mapHref = resolveVideosPortraitMapHref(item);
  const discoverCta = resolveVideosPortraitDiscoverCta(item);
  const originalSound = formatVideosPortraitOriginalSound(item);

  return (
    <article
      data-videos-desktop-portrait=""
      data-videos-desktop-featured={featured ? "" : undefined}
      data-videos-portrait-type={item.video_type}
      className="feed-desktop-surface overflow-hidden"
    >
      {/* Mobile + medium : même structure que la carte paysage */}
      <div className="videos-portrait-compact lg:hidden">
        <VideosStreamMediaFrame item={item} featured={featured} />

        <div className="space-y-2 px-5 py-4 sm:px-6">
          <Link href={href} className="block">
            <h3 className="text-base font-bold leading-snug text-neutral-900 hover:text-yunicity-primary">
              {title}
            </h3>
          </Link>

          {profileHref ? (
            <Link
              href={profileHref}
              className={`${VIDEO_TOUCH_TARGET} text-sm font-medium text-neutral-500 transition hover:text-yunicity-primary ${VIDEO_CANVAS_FOCUS}`}
            >
              {handle}
            </Link>
          ) : (
            <p className="text-sm font-medium text-neutral-500">{handle}</p>
          )}

          <PortraitSimpleMetaActions
            item={item}
            onToggleLike={() => void interactions.toggleLike(item)}
            onOpenComments={() => setCommentsOpen(true)}
            onShare={() => void interactions.shareVideo(item)}
            onReport={() => setReportOpen(true)}
            shareHint={interactions.shareHint}
          />
        </div>
      </div>

      {/* Desktop ≥1024 : split sombre maquette */}
      <div className="videos-portrait-desktop hidden min-h-[22rem] bg-[#0f1419] lg:grid lg:grid-cols-2 lg:items-stretch">
        <Link href={href} className="group relative block min-h-[18rem] overflow-hidden bg-neutral-900 lg:min-h-0 lg:h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnail_url}
            alt=""
            loading={featured ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition group-hover:bg-black/25">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-black/5">
              <Play className="ml-0.5 h-6 w-6 fill-yunicity-primary text-yunicity-primary" aria-hidden />
            </span>
          </span>
          <span className="absolute bottom-3 right-3 rounded-md bg-neutral-950/80 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
            {formatLocalVideoDuration(item.duration_seconds)}
          </span>
        </Link>

        <div className="flex flex-col px-5 py-5 text-white sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <ProfileAvatar name={author} src={item.author.avatar_url} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{author}</p>
                {profileHref ? (
                  <Link
                    href={profileHref}
                    className="mt-1.5 inline-flex rounded-lg bg-yunicity-primary px-3 py-1 text-xs font-semibold text-white transition hover:bg-yunicity-primary-hover"
                  >
                    {VIDEOS_DESKTOP_VIEW_PROFILE}
                  </Link>
                ) : null}
              </div>
            </div>

            <PortraitOverflowMenu onReport={() => setReportOpen(true)} variant="dark" />
          </div>

          {placeLabel ? (
            <p className="mt-4 inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-emerald-400/70 px-3 py-1 text-xs font-semibold text-emerald-300">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{placeLabel}</span>
            </p>
          ) : null}

          <Link href={href} className="mt-3 block">
            <h3 className="text-lg font-bold leading-snug text-white">{title}</h3>
          </Link>

          {hashtags.length > 0 ? (
            <p className="mt-2 text-sm text-neutral-400">{hashtags.join(" ")}</p>
          ) : item.description?.trim() ? (
            <p className="mt-2 line-clamp-2 text-sm text-neutral-400">{item.description.trim()}</p>
          ) : null}

          <div className="mt-auto space-y-4 pt-5">
            <div className="flex flex-col gap-5 text-sm text-neutral-100 sm:gap-6">
              <button
                type="button"
                onClick={() => void interactions.toggleLike(item)}
                aria-label={VIDEO_DETAIL_LIKE}
                aria-pressed={item.liked_by_me}
                className={`inline-flex min-h-11 min-w-11 items-center gap-2 transition hover:text-white ${VIDEO_CANVAS_FOCUS}`}
              >
                <Heart
                  className={`h-5 w-5 ${item.liked_by_me ? "fill-rose-400 text-rose-400" : ""}`}
                  aria-hidden
                />
                {item.like_count}
              </button>
              <button
                type="button"
                onClick={() => setCommentsOpen(true)}
                aria-label={VIDEO_DETAIL_COMMENT}
                className={`inline-flex min-h-11 min-w-11 items-center gap-2 transition hover:text-white ${VIDEO_CANVAS_FOCUS}`}
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                {item.comment_count}
              </button>
              <button
                type="button"
                onClick={() => void interactions.shareVideo(item)}
                aria-label={VIDEO_DETAIL_SHARE}
                className={`inline-flex min-h-11 min-w-11 items-center gap-2 transition hover:text-white ${VIDEO_CANVAS_FOCUS}`}
              >
                <Share2 className="h-5 w-5" aria-hidden />
                {VIDEOS_DESKTOP_SHARE}
              </button>
              <button
                type="button"
                disabled
                aria-label={VIDEO_DETAIL_MOBILE_BOOKMARK_SOON}
                className={`inline-flex min-h-11 min-w-11 items-center gap-2 text-neutral-400 ${VIDEO_CANVAS_FOCUS}`}
              >
                <Bookmark className="h-5 w-5" aria-hidden />
                {VIDEOS_DESKTOP_SAVE}
              </button>
            </div>

            <div className="space-y-2 border-t border-white/10 pt-4">
              {mapHref ? (
                <Link
                  href={mapHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary/70 px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/10"
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                  {VIDEOS_DESKTOP_SEE_ON_MAP}
                </Link>
              ) : null}

              {discoverCta ? (
                <Link
                  href={discoverCta.href}
                  className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <span className="truncate">{discoverCta.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                </Link>
              ) : null}
            </div>

            <p className="inline-flex items-center gap-2 text-xs text-neutral-300">
              <Music2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{originalSound}</span>
            </p>
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
