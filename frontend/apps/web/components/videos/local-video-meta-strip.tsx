"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import { formatLocalVideoTypeLabel, formatVideoAuthorHandle } from "@yunicity/utils";

export function LocalVideoMetaStrip({ item }: { item: LocalVideoFeedItem }) {
  const title = item.title?.trim() || item.cultural_place_name?.trim() || item.description?.trim();
  return (
    <div className="space-y-1 text-white">
      <p className="text-sm font-semibold">{formatVideoAuthorHandle(item)}</p>
      {title ? <p className="text-base font-bold leading-snug">{title}</p> : null}
      <span className="inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
        {formatLocalVideoTypeLabel(item.video_type)}
      </span>
    </div>
  );
}
