"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodDetailDesktopFeedItem } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_DESKTOP_FEED_EMPTY,
  NEIGHBORHOOD_DETAIL_DESKTOP_FEED_TITLE,
  NEIGHBORHOOD_DETAIL_DESKTOP_VIEW_ALL_FEED,
  NEIGHBORHOOD_DETAIL_DESKTOP_VIEW_POST,
} from "@yunicity/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type NeighborhoodDetailDesktopFeedProps = {
  items: NeighborhoodDetailDesktopFeedItem[];
  viewAllHref: string;
};

export function NeighborhoodDetailDesktopFeed({
  items,
  viewAllHref,
}: NeighborhoodDetailDesktopFeedProps) {
  const previewItems = items.slice(0, 2);

  return (
    <section id="nd-desktop-feed" className="neighborhood-detail-section space-y-4">
      <h2 className="text-lg font-bold tracking-tight text-neutral-950">
        {NEIGHBORHOOD_DETAIL_DESKTOP_FEED_TITLE}
      </h2>

      {previewItems.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
          {NEIGHBORHOOD_DETAIL_DESKTOP_FEED_EMPTY}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {previewItems.map((item) => (
            <article
              key={item.id}
              className="flex gap-3 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm"
            >
              <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                <CulturalImage
                  src={item.imageUrl}
                  alt=""
                  placeName="Publication"
                  sizes="96px"
                  className="absolute inset-0 h-full w-full"
                  imageClassName="h-full w-full object-cover"
                  dimOverlay={false}
                  showFallbackCaption={false}
                  fallbackLabel="Fil"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2 py-0.5">
                <p className="line-clamp-3 text-sm leading-relaxed text-neutral-800">{item.body}</p>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
                >
                  {NEIGHBORHOOD_DETAIL_DESKTOP_VIEW_POST}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <Link
        href={viewAllHref}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 transition hover:border-neutral-300"
      >
        {NEIGHBORHOOD_DETAIL_DESKTOP_VIEW_ALL_FEED}
      </Link>
    </section>
  );
}
