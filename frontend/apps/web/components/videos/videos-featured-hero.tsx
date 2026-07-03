"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  VIDEOS_FEATURED_BADGE,
  VIDEOS_FEATURED_NEXT,
  VIDEOS_FEATURED_PREV,
  buildLocalVideoTeaserHref,
  formatLocalVideoDuration,
  formatVideoAuthorHandle,
  resolveLocalVideoTeaserTitle,
} from "@yunicity/utils";
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Play } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type VideosFeaturedHeroProps = {
  items: LocalVideoFeedItem[];
};

export function VideosFeaturedHero({ items }: VideosFeaturedHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const featured = items[0];
  const sideItems = useMemo(() => items.slice(1, 4), [items]);

  if (!featured) return null;

  const hero = items[activeIndex] ?? featured;
  const heroTitle = resolveLocalVideoTeaserTitle(hero);
  const heroHref = buildLocalVideoTeaserHref(hero.id);

  function goTo(index: number) {
    if (items.length === 0) return;
    const normalized = ((index % items.length) + items.length) % items.length;
    setActiveIndex(normalized);
  }

  return (
    <section className="relative" aria-label="Vidéos à la une">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.75fr)] lg:gap-4">
        <Link
          href={heroHref}
          className="group relative min-h-[16rem] overflow-hidden rounded-3xl bg-neutral-900 shadow-md sm:min-h-[20rem] lg:min-h-[22rem]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.thumbnail_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/25 to-neutral-950/10" />

          <span className="absolute left-4 top-4 rounded-full bg-yunicity-primary px-3 py-1 text-xs font-semibold text-white">
            {VIDEOS_FEATURED_BADGE}
          </span>

          <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 sm:p-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white sm:text-2xl">{heroTitle}</h2>
              <p className="text-sm font-medium text-white/85">{formatVideoAuthorHandle(hero)}</p>
              {hero.description?.trim() ? (
                <p className="line-clamp-2 max-w-xl text-sm text-white/75">{hero.description}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-4 text-sm text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <Heart className="h-4 w-4" aria-hidden />
                {hero.like_count}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" aria-hidden />
                {hero.comment_count}
              </span>
              <span className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
                <Play className="h-5 w-5 fill-white" aria-hidden />
              </span>
              <span className="rounded-md bg-neutral-950/60 px-2 py-1 text-xs font-semibold tabular-nums">
                {formatLocalVideoDuration(hero.duration_seconds)}
              </span>
            </div>

            <div className="flex justify-center gap-1.5 pt-1">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Afficher la vidéo ${index + 1}`}
                  aria-current={index === activeIndex}
                  onClick={(event) => {
                    event.preventDefault();
                    goTo(index);
                  }}
                  className={`h-2 rounded-full transition ${
                    index === activeIndex ? "w-6 bg-yunicity-primary" : "w-2 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </Link>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {sideItems.map((item) => (
            <SideCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {items.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-[-0.75rem] top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-md transition hover:border-yunicity-primary/30 hover:text-yunicity-primary xl:flex"
            aria-label={VIDEOS_FEATURED_PREV}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-[-0.75rem] top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-md transition hover:border-yunicity-primary/30 hover:text-yunicity-primary xl:flex"
            aria-label={VIDEOS_FEATURED_NEXT}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </>
      ) : null}
    </section>
  );
}

function SideCard({ item }: { item: LocalVideoFeedItem }) {
  const href = buildLocalVideoTeaserHref(item.id);
  const title = resolveLocalVideoTeaserTitle(item);

  return (
    <Link
      href={href}
      className="group relative min-h-[7rem] overflow-hidden rounded-2xl bg-neutral-900 shadow-sm sm:min-h-[8rem]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.thumbnail_url}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 space-y-0.5 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-white">{title}</p>
        <div className="flex items-center justify-between gap-2 text-xs text-white/80">
          <span>{formatVideoAuthorHandle(item)}</span>
          <span className="rounded bg-neutral-950/60 px-1.5 py-0.5 font-semibold tabular-nums">
            {formatLocalVideoDuration(item.duration_seconds)}
          </span>
        </div>
      </div>
    </Link>
  );
}
