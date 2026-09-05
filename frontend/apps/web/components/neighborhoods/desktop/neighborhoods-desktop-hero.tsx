"use client";

import { CulturalImage, CulturalImageCredit } from "@/components/culture/cultural-image";
import type { NeighborhoodsDesktopHeroCard, NeighborhoodsDesktopTag } from "@yunicity/utils";
import {
  formatEditorialImageAttribution,
  resolveNeighborhoodsDesktopImageCredit,
  NEIGHBORHOODS_DESKTOP_EXPLORE_NEIGHBORHOOD,
  NEIGHBORHOODS_DESKTOP_FEATURED_BADGE,
  NEIGHBORHOODS_DESKTOP_FOLLOW,
  NEIGHBORHOODS_DESKTOP_FOLLOWING,
  NEIGHBORHOODS_DESKTOP_VIEW_ON_MAP,
} from "@yunicity/utils";
import { Bookmark, CalendarDays, Map } from "lucide-react";
import Link from "next/link";

const TAG_CLASS: Record<NeighborhoodsDesktopTag["tone"], string> = {
  peach: "bg-orange-100 text-orange-800",
  purple: "bg-violet-100 text-violet-800",
  yellow: "bg-amber-100 text-amber-900",
  blue: "bg-sky-100 text-sky-800",
  indigo: "bg-indigo-100 text-indigo-800",
  green: "bg-emerald-100 text-emerald-800",
  slate: "bg-slate-100 text-slate-700",
};

type NeighborhoodsDesktopHeroProps = {
  card: NeighborhoodsDesktopHeroCard;
  isFollowed: boolean;
  onToggleFollow: () => void;
};

export function NeighborhoodsDesktopHero({
  card,
  isFollowed,
  onToggleFollow,
}: NeighborhoodsDesktopHeroProps) {
  const imageCredit = resolveNeighborhoodsDesktopImageCredit({ slug: card.slug });
  return (
    <article
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-neighborhoods-desktop-hero=""
    >
      <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="relative min-h-[240px] md:min-h-[320px]">
          <div className="absolute inset-0">
            <CulturalImage
              src={card.imageUrl}
              alt={card.name}
              placeName={card.name}
              className="h-full w-full"
              imageClassName="object-cover"
              sizes="(min-width: 1024px) 480px, 100vw"
              showFallbackCaption
              fallbackLabel="Quartier"
              overlay={false}
              priority
            />
          </div>
        </div>

        <div className="flex flex-col p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">
            {NEIGHBORHOODS_DESKTOP_FEATURED_BADGE}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-950 sm:text-3xl">{card.name}</h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {card.tags.map((tag) => (
              <span
                key={tag.id}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${TAG_CLASS[tag.tone]}`}
              >
                {tag.label}
              </span>
            ))}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-neutral-600">{card.description}</p>

          {card.eventLine ? (
            <p className="mt-4 inline-flex items-start gap-2 text-sm text-neutral-700">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              <span>{card.eventLine}</span>
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
            <Link
              href={card.href}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
            >
              {NEIGHBORHOODS_DESKTOP_EXPLORE_NEIGHBORHOOD}
            </Link>
            <button
              type="button"
              onClick={onToggleFollow}
              aria-pressed={isFollowed}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
            >
              <Bookmark
                className={`h-4 w-4 ${isFollowed ? "fill-yunicity-primary text-yunicity-primary" : ""}`}
                aria-hidden
              />
              {isFollowed ? NEIGHBORHOODS_DESKTOP_FOLLOWING : NEIGHBORHOODS_DESKTOP_FOLLOW}
            </button>
            <Link
              href={card.mapHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              <Map className="h-4 w-4" aria-hidden />
              {NEIGHBORHOODS_DESKTOP_VIEW_ON_MAP}
            </Link>
          </div>
          {imageCredit ? (
            <CulturalImageCredit
              credit={formatEditorialImageAttribution(imageCredit)}
              sourceUrl={imageCredit.sourceUrl}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
