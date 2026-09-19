"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import { resolveLocalVideoLayout } from "@yunicity/utils";

import { VideosDesktopLandscapeCard } from "@/components/videos/desktop/videos-desktop-landscape-card";
import { VideosDesktopPortraitCard } from "@/components/videos/desktop/videos-desktop-portrait-card";

type VideosDesktopFeedStreamProps = {
  items: readonly LocalVideoFeedItem[];
};

export function VideosDesktopFeedStream({ items }: VideosDesktopFeedStreamProps) {
  if (items.length === 0) return null;

  return (
    <div data-videos-desktop-feed="" className="flex flex-col gap-5">
      {items.map((item, index) => {
        const layout = resolveLocalVideoLayout(item);
        const featured = index === 0 && layout === "portrait";

        if (layout === "portrait") {
          return (
            <VideosDesktopPortraitCard key={item.id} item={item} featured={featured} />
          );
        }

        return <VideosDesktopLandscapeCard key={item.id} item={item} />;
      })}
    </div>
  );
}
