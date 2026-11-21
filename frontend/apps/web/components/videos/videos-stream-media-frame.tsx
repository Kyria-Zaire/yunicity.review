"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  buildLocalVideoTeaserHref,
  formatLocalVideoDuration,
  resolveLocalVideoLayout,
} from "@yunicity/utils";
import { Play } from "lucide-react";
import Link from "next/link";

type VideosStreamMediaFrameProps = {
  item: LocalVideoFeedItem;
  featured?: boolean;
  className?: string;
};

/**
 * Vignette feed vidéo — ratio fidèle à l'orientation API (ffprobe).
 * Portrait 9:16 · paysage 16:9.
 */
export function VideosStreamMediaFrame({
  item,
  featured = false,
  className = "",
}: VideosStreamMediaFrameProps) {
  const layout = resolveLocalVideoLayout(item);
  const href = buildLocalVideoTeaserHref(item.id);
  const isPortrait = layout === "portrait";

  return (
    <Link href={href} className={`group block ${className}`.trim()}>
      <div
        data-videos-media-layout={layout}
        className={`relative overflow-hidden bg-neutral-900 ${
          isPortrait
            ? "mx-auto aspect-[9/16] w-full max-w-[11rem] sm:max-w-[12.5rem] md:max-w-[13.5rem]"
            : "aspect-video w-full"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnail_url}
          alt=""
          loading={featured ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/20">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-md">
            <Play className="ml-0.5 h-6 w-6 fill-yunicity-primary text-yunicity-primary" aria-hidden />
          </span>
        </span>
        <span className="absolute bottom-3 right-3 rounded-md bg-neutral-950/80 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
          {formatLocalVideoDuration(item.duration_seconds)}
        </span>
      </div>
    </Link>
  );
}
