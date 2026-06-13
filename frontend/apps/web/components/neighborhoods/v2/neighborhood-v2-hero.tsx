"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { LocalVideoTeaserRail } from "@/components/videos/local-video-teaser-rail";
import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_V2_OFFICIAL_BADGE,
  NEIGHBORHOOD_V2_VIDEOS_TITLE,
  formatNeighborhoodV2AliasLine,
  formatNeighborhoodV2ExploreCta,
  formatNeighborhoodV2MoodLabels,
  mapNeighborhoodDetailVideosToFeedItems,
  NEIGHBORHOOD_V2_EXPLORE_ANCHOR,
  resolveNeighborhoodV2HeroImage,
  resolveNeighborhoodV2HeroQuote,
} from "@yunicity/utils";
import { useMemo } from "react";

type NeighborhoodV2HeroProps = {
  detail: NeighborhoodDetail;
};

export function NeighborhoodV2Hero({ detail }: NeighborhoodV2HeroProps) {
  const displayName = detail.hero?.display_name ?? detail.display_name;
  const officialLabel = detail.hero?.official_label ?? NEIGHBORHOOD_V2_OFFICIAL_BADGE;
  const aliases = detail.hero?.aliases ?? detail.aliases ?? [];
  const moodSlugs = detail.hero?.moods ?? detail.moods ?? [];
  const heroImage = resolveNeighborhoodV2HeroImage(detail);
  const quote = resolveNeighborhoodV2HeroQuote(detail);
  const aliasLine = formatNeighborhoodV2AliasLine(aliases);
  const moodLabels = formatNeighborhoodV2MoodLabels(moodSlugs);
  const videoItems = useMemo(() => mapNeighborhoodDetailVideosToFeedItems(detail), [detail]);

  function scrollToExplore() {
    document.getElementById(NEIGHBORHOOD_V2_EXPLORE_ANCHOR)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
      <div className="relative aspect-[4/3] max-h-[min(52vh,360px)] w-full bg-neutral-200 sm:aspect-[16/9] sm:max-h-none">
        {heroImage ? (
          <CulturalImage
            src={heroImage}
            alt={displayName}
            placeName={displayName}
            className="absolute inset-0 h-full w-full"
            sizes="(max-width: 768px) 100vw, 1100px"
            showFallbackCaption={false}
            overlay={false}
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-800" />
        )}

        <div
          className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/25 to-transparent"
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 sm:p-6">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            {officialLabel}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{displayName}</h1>
          {aliasLine ? <p className="text-sm font-medium text-white/85">{aliasLine}</p> : null}
          {moodLabels.length > 0 ? (
            <p className="text-xs font-medium text-white/80 sm:text-sm">{moodLabels.join(" · ")}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 px-4 py-6 sm:px-6">
        {quote ? (
          <blockquote className="border-l-2 border-yunicity-primary/40 pl-4 text-base italic leading-relaxed text-neutral-700">
            « {quote} »
          </blockquote>
        ) : null}

        <button
          type="button"
          onClick={scrollToExplore}
          className="min-h-11 w-full rounded-full bg-yunicity-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90"
        >
          {formatNeighborhoodV2ExploreCta(displayName)}
        </button>

        {videoItems.length > 0 ? (
          <LocalVideoTeaserRail
            items={videoItems}
            title={NEIGHBORHOOD_V2_VIDEOS_TITLE}
            seeAllHref={`/videos?city=${encodeURIComponent(detail.city)}`}
            layout="scroll"
            embedded
          />
        ) : null}
      </div>
    </section>
  );
}
