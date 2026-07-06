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
import { Heart, MessageCircle, MoreVertical, Play } from "lucide-react";
import Link from "next/link";

type VideosMobileGridCardProps = {
  item: LocalVideoFeedItem;
};

/** Carte grille mobile 2 colonnes (MOBILE-VIDEOS-01). */
export function VideosMobileGridCard({ item }: VideosMobileGridCardProps) {
  const title = resolveLocalVideoTeaserTitle(item);
  const href = buildLocalVideoTeaserHref(item.id);

  return (
    <article className="min-w-0">
      <Link href={href} className="group block">
        <div className="relative overflow-hidden rounded-2xl bg-neutral-200 ring-1 ring-neutral-200/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnail_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-[4/5] w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/10">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm">
              <Play className="ml-0.5 h-4 w-4 fill-neutral-900 text-neutral-900" aria-hidden />
            </span>
          </span>
          <span className="absolute right-2 top-2 rounded-md bg-neutral-950/75 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
            {formatLocalVideoDuration(item.duration_seconds)}
          </span>
        </div>
      </Link>

      <div className="mt-2 space-y-1">
        <Link href={href}>
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-neutral-900">{title}</h3>
        </Link>
        <p className="truncate text-xs font-medium text-neutral-500">{formatVideoAuthorHandle(item)}</p>
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
          <span>{formatVideoTemporalLabel(item.published_at)}</span>
          <span className="inline-flex items-center gap-0.5">
            <Heart className="h-3 w-3" aria-hidden />
            {item.like_count}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <MessageCircle className="h-3 w-3" aria-hidden />
            {item.comment_count}
          </span>
          <button
            type="button"
            className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-neutral-400"
            aria-label={VIDEOS_GRID_MORE}
            onClick={(event) => event.preventDefault()}
          >
            <MoreVertical className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
