"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_MOBILE_LOCATION,
  NEIGHBORHOOD_V2_OFFICIAL_BADGE,
  NEIGHBORHOOD_V2_PHOTO_CREDIT_PREFIX,
  buildNeighborhoodMobileHeroDescription,
  buildNeighborhoodMobileHeroStatsLine,
  resolveNeighborhoodMobileHeroImage,
  resolveNeighborhoodV2HeroImageCredit,
} from "@yunicity/utils";
import { MapPin, Users } from "lucide-react";

type NeighborhoodMobileDetailHeroProps = {
  detail: NeighborhoodDetail;
};

/** Hero détail quartier mobile (MOBILE-QUARTIERS-02). */
export function NeighborhoodMobileDetailHero({ detail }: NeighborhoodMobileDetailHeroProps) {
  const displayName = detail.hero?.display_name ?? detail.display_name;
  const heroImage = resolveNeighborhoodMobileHeroImage(detail);
  const heroCredit = resolveNeighborhoodV2HeroImageCredit(detail);
  const description = buildNeighborhoodMobileHeroDescription(detail);
  const statsLine = buildNeighborhoodMobileHeroStatsLine(detail.stats);
  const officialLabel = detail.hero?.official_label ?? NEIGHBORHOOD_V2_OFFICIAL_BADGE;

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-900 shadow-sm">
      <div className="relative min-h-[240px]">
        {heroImage ? (
          <CulturalImage
            src={heroImage}
            alt={displayName}
            placeName={displayName}
            className="absolute inset-0 size-full object-cover"
            sizes="100vw"
            priority
            showFallbackCaption={false}
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/45 to-neutral-900/15" />

        {heroCredit?.photo_credit ? (
          <p className="absolute right-2 top-2 max-w-[65%] truncate rounded bg-black/40 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">
            {NEIGHBORHOOD_V2_PHOTO_CREDIT_PREFIX} {heroCredit.photo_credit}
          </p>
        ) : null}

        <div className="relative flex min-h-[240px] flex-col justify-end p-4">
          <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/95 text-yunicity-primary shadow-sm">
            <MapPin className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </div>

          <span className="mb-2 inline-flex w-fit rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {officialLabel}
          </span>
          <h1 className="text-2xl font-bold leading-tight text-white">{displayName}</h1>
          <p className="mt-1 text-sm text-white/90">{detail.city}</p>

          {statsLine ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-white/85">
              <Users className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden />
              {statsLine}
            </p>
          ) : null}

          {description ? (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/85">{description}</p>
          ) : null}

          <div className="mt-3 flex items-end justify-between gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              <MapPin className="h-3 w-3" aria-hidden />
              {NEIGHBORHOOD_DETAIL_MOBILE_LOCATION(detail.city)}
            </span>
            {detail.stats && detail.stats.tribes_count > 0 ? (
              <div className="flex -space-x-2" aria-hidden>
                {Array.from({ length: Math.min(4, detail.stats.tribes_count) }).map((_, index) => (
                  <span
                    key={index}
                    className="inline-flex h-7 w-7 rounded-full border-2 border-neutral-900 bg-gradient-to-br from-violet-200 to-violet-500"
                  />
                ))}
                {detail.stats.tribes_count > 4 ? (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-neutral-900 bg-neutral-700 text-[10px] font-bold text-white">
                    +{detail.stats.tribes_count - 4}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
