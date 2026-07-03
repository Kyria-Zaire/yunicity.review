"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  buildLocalVideoTeaserHref,
  formatLocalVideoDuration,
  formatVideoDetailRelatedMeta,
  resolveVideoDetailTitle,
} from "@yunicity/utils";
import Link from "next/link";

type VideoDetailRelatedCardProps = {
  item: LocalVideoFeedItem;
};

export function VideoDetailRelatedCard({ item }: VideoDetailRelatedCardProps) {
  const href = buildLocalVideoTeaserHref(item.id);
  const title = resolveVideoDetailTitle(item);

  return (
    <Link href={href} className="group flex gap-3 rounded-xl p-1 transition hover:bg-neutral-50">
      <div className="relative h-[4.5rem] w-[8rem] shrink-0 overflow-hidden rounded-xl bg-neutral-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnail_url}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-neutral-950/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
          {formatLocalVideoDuration(item.duration_seconds)}
        </span>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 group-hover:text-yunicity-primary">
          {title}
        </p>
        <p className="mt-1 truncate text-xs font-medium text-neutral-500">
          {item.author.username ? `@${item.author.username.replace(/^@/, "")}` : item.author.full_name}
        </p>
        <p className="mt-1 text-xs text-neutral-500">{formatVideoDetailRelatedMeta(item)}</p>
      </div>
    </Link>
  );
}
