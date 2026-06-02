"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { Neighborhood } from "@yunicity/types";
import type { NeighborhoodDetailQuickStat } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_HERO_SHARE,
  NEIGHBORHOOD_DETAIL_PORTAL_BADGE,
  NEIGHBORHOOD_DETAIL_SHARE_COPIED,
  neighborhoodHref,
  resolveNeighborhoodHeroImage,
} from "@yunicity/utils";
import { Clock3, MapPin, Scan, Share2, Sparkles } from "lucide-react";
import { useState } from "react";

type NeighborhoodDetailPortalHeroProps = {
  hood: Neighborhood;
  quickStats: NeighborhoodDetailQuickStat[];
};

const STAT_ICONS = {
  area: Scan,
  moments: Clock3,
  ambiance: Sparkles,
} as const;

export function NeighborhoodDetailPortalHero({ hood, quickStats }: NeighborhoodDetailPortalHeroProps) {
  const [shareHint, setShareHint] = useState<string | null>(null);
  const imageUrl = resolveNeighborhoodHeroImage(hood);

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${neighborhoodHref(hood.slug, hood.city)}`
        : neighborhoodHref(hood.slug, hood.city);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: hood.display_name, url });
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
    <article className="relative overflow-hidden rounded-3xl bg-neutral-950 shadow-lg ring-1 ring-neutral-900/10">
      <div className="relative min-h-[280px] sm:min-h-[320px]">
        <CulturalImage
          src={imageUrl}
          alt={hood.display_name}
          placeName={hood.display_name}
          className="absolute inset-0 h-full w-full"
          imageClassName="object-cover object-[62%_38%]"
          sizes="(max-width: 768px) 100vw, 1100px"
          priority
          showFallbackCaption={false}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/88 to-neutral-950/15 sm:via-neutral-950/82"
          aria-hidden
        />

        <div className="relative flex h-full min-h-[280px] flex-col justify-end p-5 sm:min-h-[320px] sm:p-7 lg:max-w-[58%]">
          <p className="inline-flex w-fit rounded-full bg-yunicity-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            {NEIGHBORHOOD_DETAIL_PORTAL_BADGE}
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
            {hood.display_name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            {hood.city}
          </p>

          {quickStats.length > 0 ? (
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {quickStats.map((stat) => {
                const Icon = STAT_ICONS[stat.id as keyof typeof STAT_ICONS] ?? Sparkles;
                return (
                  <li
                    key={stat.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/70" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">{stat.value}</p>
                        <p className="text-[11px] text-white/65">{stat.label}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-white/10 bg-neutral-950/90 px-5 py-3 sm:px-7">
        <button
          type="button"
          onClick={() => void handleShare()}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
        >
          <Share2 className="h-4 w-4" aria-hidden />
          {NEIGHBORHOOD_DETAIL_HERO_SHARE}
        </button>
        {shareHint ? <p className="ml-3 text-xs text-white/60">{shareHint}</p> : null}
      </div>
    </article>
  );
}
