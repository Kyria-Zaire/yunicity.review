"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  VIDEO_DETAIL_COMMENT,
  VIDEO_DETAIL_FOLLOW,
  VIDEO_DETAIL_FOLLOW_SOON,
  VIDEO_DETAIL_LIKE,
  VIDEO_DETAIL_MORE,
  VIDEO_DETAIL_SHARE,
  formatLocalVideoDuration,
  formatVideoDetailAuthorLine,
  formatVideoDetailLocation,
  formatVideoTemporalLabel,
  formatVideoViewCountLabel,
  resolveVideoDetailTitle,
} from "@yunicity/utils";
import {
  CalendarDays,
  Clock3,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  MoreVertical,
  Share2,
} from "lucide-react";

type VideoDetailMetaProps = {
  item: LocalVideoFeedItem;
  onToggleLike: () => void;
  onShare: () => void;
  onOpenComments: () => void;
  onOpenReport: () => void;
};

function authorInitials(item: LocalVideoFeedItem): string {
  const name = item.author.full_name?.trim() || item.author.username || "YU";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function actionButtonClass(active = false): string {
  return `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
    active
      ? "border-yunicity-primary/20 bg-yunicity-primary-soft text-yunicity-primary"
      : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300"
  }`;
}

export function VideoDetailMeta({
  item,
  onToggleLike,
  onShare,
  onOpenComments,
  onOpenReport,
}: VideoDetailMetaProps) {
  const title = resolveVideoDetailTitle(item);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{title}</h1>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleLike}
            aria-pressed={item.liked_by_me}
            className={actionButtonClass(item.liked_by_me)}
          >
            <Heart className={`h-4 w-4 ${item.liked_by_me ? "fill-current" : ""}`} aria-hidden />
            <span className="sr-only">{VIDEO_DETAIL_LIKE}</span>
            {item.like_count}
          </button>
          <button type="button" onClick={onOpenComments} className={actionButtonClass()}>
            <MessageCircle className="h-4 w-4" aria-hidden />
            <span className="sr-only">{VIDEO_DETAIL_COMMENT}</span>
            {item.comment_count}
          </button>
          <button type="button" onClick={onShare} className={actionButtonClass()}>
            <Share2 className="h-4 w-4" aria-hidden />
            {VIDEO_DETAIL_SHARE}
          </button>
          <button
            type="button"
            onClick={onOpenReport}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
            aria-label={VIDEO_DETAIL_MORE}
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {item.author.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.author.avatar_url}
              alt=""
              className="h-11 w-11 rounded-full object-cover ring-2 ring-white"
            />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-yunicity-primary text-sm font-bold text-white">
              {authorInitials(item)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {formatVideoDetailAuthorLine(item)}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled
          title={VIDEO_DETAIL_FOLLOW_SOON}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#ECE8FF] px-5 py-2.5 text-sm font-semibold text-[#5B44D6] opacity-80"
        >
          {VIDEO_DETAIL_FOLLOW}
        </button>
      </div>

      {item.description?.trim() ? (
        <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-neutral-700">
          {item.description}
        </p>
      ) : null}

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600">
        <li className="inline-flex items-center gap-1.5">
          <Eye className="h-4 w-4 text-neutral-400" aria-hidden />
          {formatVideoViewCountLabel(item.view_count ?? 0)}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-neutral-400" aria-hidden />
          {formatVideoTemporalLabel(item.published_at)}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-neutral-400" aria-hidden />
          {formatVideoDetailLocation(item)}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Clock3 className="h-4 w-4 text-neutral-400" aria-hidden />
          {formatLocalVideoDuration(item.duration_seconds)}
        </li>
      </ul>
    </section>
  );
}
