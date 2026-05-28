"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { Neighborhood } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_HERO_EVENTS_CTA,
  NEIGHBORHOOD_DETAIL_HERO_MAP_CTA,
  NEIGHBORHOOD_DETAIL_HERO_SHARE,
  NEIGHBORHOOD_DETAIL_SHARE_COPIED,
  buildNeighborhoodDetailMapUrl,
  neighborhoodAmbianceBadge,
  neighborhoodHeroTagline,
  neighborhoodHref,
  resolveNeighborhoodHeroImage,
} from "@yunicity/utils";
import { CloudSun, MapPin, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type NeighborhoodDetailHeroProps = {
  hood: Neighborhood;
  weatherLabel: string | null;
};

export function NeighborhoodDetailHero({ hood, weatherLabel }: NeighborhoodDetailHeroProps) {
  const [shareHint, setShareHint] = useState<string | null>(null);
  const imageUrl = resolveNeighborhoodHeroImage(hood);
  const badge = neighborhoodAmbianceBadge(hood.ambiance);
  const tagline = neighborhoodHeroTagline(hood);
  const mapHref = buildNeighborhoodDetailMapUrl(hood);
  const eventsAnchor = "#neighborhood-moments";

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${neighborhoodHref(hood.slug, hood.city)}`
        : neighborhoodHref(hood.slug, hood.city);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: hood.display_name, text: tagline, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint(NEIGHBORHOOD_DETAIL_SHARE_COPIED);
      setTimeout(() => setShareHint(null), 2500);
    } catch {
      /* annulation */
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl bg-yunicity-primary text-white shadow-lg ring-1 ring-yunicity-primary/20">
      <div>
        <CulturalImage
          src={imageUrl}
          alt={hood.display_name}
          placeName={hood.display_name}
          className="h-44 w-full sm:h-52 md:h-60"
          imageClassName="object-[50%_24%]"
          sizes="(max-width: 768px) 100vw, 900px"
          priority
          showFallbackCaption={false}
        />
      </div>

      <div className="bg-yunicity-primary p-5 pb-6 sm:p-7 sm:pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            {badge}
          </p>
          {weatherLabel ? (
            <p className="inline-flex items-center gap-1 rounded-full border border-white/20 px-2.5 py-1 text-[11px] font-medium text-white/90">
              <CloudSun className="h-3.5 w-3.5" aria-hidden />
              {weatherLabel}
            </p>
          ) : null}
        </div>

        <h1 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
          {hood.display_name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">{tagline}</p>
        <p className="mt-1 text-sm text-white/75">{hood.city}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href={mapHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {NEIGHBORHOOD_DETAIL_HERO_MAP_CTA}
          </Link>
          <a
            href={eventsAnchor}
            className="inline-flex rounded-full border border-white/35 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            {NEIGHBORHOOD_DETAIL_HERO_EVENTS_CTA}
          </a>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            {NEIGHBORHOOD_DETAIL_HERO_SHARE}
          </button>
        </div>
        {shareHint ? <p className="mt-2 text-xs text-white/70">{shareHint}</p> : null}
      </div>
    </article>
  );
}
