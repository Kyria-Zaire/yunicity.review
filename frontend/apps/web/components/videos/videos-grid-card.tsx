"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  VIDEOS_GRID_MORE,
  buildLocalVideoTeaserHref,
  formatLocalVideoDuration,
  formatVideoAuthorHandle,
  formatVideoTemporalLabel,
  resolveLocalVideoTeaserTitle,
} from "@yunicity/utils";
import { Heart, MessageCircle, MoreVertical } from "lucide-react";
import Link from "next/link";

type VideosGridCardProps = {
  item: LocalVideoFeedItem;
};

export function VideosGridCard({ item }: VideosGridCardProps) {
  const title = resolveLocalVideoTeaserTitle(item);
  const href = buildLocalVideoTeaserHref(item.id);

  return (
    <article className="group">
      <Link href={href} className="block">
        <div className="relative overflow-hidden rounded-2xl bg-neutral-200 shadow-sm ring-1 ring-neutral-200/80 transition group-hover:ring-yunicity-primary/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnail_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
          <span className="absolute bottom-2 right-2 rounded-md bg-neutral-950/80 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">
            {formatLocalVideoDuration(item.duration_seconds)}
          </span>
        </div>
      </Link>

      <div className="mt-3 space-y-1.5">
        <Link href={href} className="block">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-neutral-900 group-hover:text-yunicity-primary">
            {title}
          </h3>
        </Link>
        <p className="text-xs font-medium text-neutral-500">{formatVideoAuthorHandle(item)}</p>
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span>{formatVideoTemporalLabel(item.published_at)}</span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" aria-hidden />
            {item.like_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            {item.comment_count}
          </span>
          <button
            type="button"
            className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            aria-label={VIDEOS_GRID_MORE}
            onClick={(event) => event.preventDefault()}
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
