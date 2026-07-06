"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  VIDEOS_FEATURED_BADGE,
  buildLocalVideoTeaserHref,
  formatLocalVideoDuration,
  formatVideoAuthorHandle,
  formatVideoDetailLocation,
  resolveLocalVideoTeaserTitle,
} from "@yunicity/utils";
import { Heart, MapPin, MessageCircle, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type VideosMobileFeaturedHeroProps = {
  items: LocalVideoFeedItem[];
};

/** Hero vidéo mobile — carousel une carte + dots (MOBILE-VIDEOS-01). */
export function VideosMobileFeaturedHero({ items }: VideosMobileFeaturedHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) return null;

  const hero = items[activeIndex] ?? items[0]!;
  const heroTitle = resolveLocalVideoTeaserTitle(hero);
  const heroHref = buildLocalVideoTeaserHref(hero.id);
  const location = formatVideoDetailLocation(hero);

  return (
    <section aria-label="Vidéo à la une">
      <Link
        href={heroHref}
        className="group relative block min-h-[15.5rem] overflow-hidden rounded-2xl bg-neutral-900 shadow-md"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.thumbnail_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/30 to-neutral-950/10" />

        <span className="absolute left-3 top-3 rounded-full bg-yunicity-primary px-2.5 py-0.5 text-[11px] font-semibold text-white">
          {VIDEOS_FEATURED_BADGE}
        </span>
        <span className="absolute right-3 top-3 rounded-md bg-neutral-950/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">
          {formatLocalVideoDuration(hero.duration_seconds)}
        </span>

        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-lg">
          <Play className="ml-0.5 h-6 w-6 fill-neutral-900 text-neutral-900" aria-hidden />
        </span>

        <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
          <h2 className="text-lg font-bold leading-snug text-white">{heroTitle}</h2>
          <p className="text-sm font-medium text-white/90">{formatVideoAuthorHandle(hero)}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/90">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" aria-hidden />
              {hero.like_count}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              {hero.comment_count}
            </span>
            {location ? (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{location}</span>
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {items.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Afficher la vidéo ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition ${
                index === activeIndex ? "w-5 bg-yunicity-primary" : "w-1.5 bg-neutral-300"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
