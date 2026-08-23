"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_TEASER_CTA,
  buildLocalVideoTeaserHref,
  formatVideoAuthorDisplayName,
  formatLocalVideoDuration,
  formatLocalVideoTypeLabel,
  resolveLocalVideoTeaserTitle,
} from "@yunicity/utils";
import Link from "next/link";

type LocalVideoTeaserCardProps = {
  item: LocalVideoFeedItem;
};

export function LocalVideoTeaserCard({ item }: LocalVideoTeaserCardProps) {
  const title = resolveLocalVideoTeaserTitle(item);
  const href = buildLocalVideoTeaserHref(item.id);

  return (
    <Link
      href={href}
      className="group flex gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm transition hover:border-yunicity-primary/30 hover:shadow-md"
    >
      <div
        data-feed-video-media=""
        className="relative h-[7.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-neutral-200"
      >
        {/* Thumbnail only — no video element (C2-S5 perf rule). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnail_url}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-neutral-950/75 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
          {formatLocalVideoDuration(item.duration_seconds)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-yunicity-primary">
            {item.neighborhood_name}
          </p>
          <p className="line-clamp-2 text-sm font-bold leading-snug text-neutral-900">{title}</p>
          <p className="text-xs font-medium text-neutral-600">
            {formatVideoAuthorDisplayName(item)}
          </p>
          <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
            {formatLocalVideoTypeLabel(item.video_type)}
          </span>
        </div>
        <span className="mt-2 text-xs font-semibold text-yunicity-primary group-hover:underline">
          {LOCAL_VIDEO_TEASER_CTA}
        </span>
      </div>
    </Link>
  );
}
