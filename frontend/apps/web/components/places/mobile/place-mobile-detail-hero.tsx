"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { CulturalPlaceDetail } from "@yunicity/types";
import {
  PLACE_DETAIL_MOBILE_FAVORITE,
  PLACE_DETAIL_MOBILE_FAVORITE_SOON,
  PLACE_DETAIL_MOBILE_PHOTOS_CTA,
  buildPlaceMobileDetailCategoryLabel,
  buildPlaceMobileDetailHeroStatsLine,
  buildPlaceMobileDetailHeroStatusLine,
  countPlaceMobileDetailPhotos,
  resolveCulturalPlaceDisplayUrl,
} from "@yunicity/utils";
import { Camera, Heart } from "lucide-react";

type PlaceMobileDetailHeroProps = {
  place: CulturalPlaceDetail;
  onOpenPhotos: () => void;
};

/** Hero détail lieu mobile (MOBILE-LIEUX-02). */
export function PlaceMobileDetailHero({ place, onOpenPhotos }: PlaceMobileDetailHeroProps) {
  const heroUrl = resolveCulturalPlaceDisplayUrl(place, "hero");
  const categoryLabel = buildPlaceMobileDetailCategoryLabel(place);
  const statusLine = buildPlaceMobileDetailHeroStatusLine(place);
  const statsLine = buildPlaceMobileDetailHeroStatsLine(place);
  const photoCount = countPlaceMobileDetailPhotos(place);

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-900 shadow-sm">
      <div className="relative min-h-[260px]">
        <CulturalImage
          src={heroUrl}
          alt={place.name}
          placeName={place.name}
          className="absolute inset-0 size-full object-cover"
          sizes="100vw"
          priority
          showFallbackCaption={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/45 to-neutral-900/15" />

        <button
          type="button"
          disabled
          title={PLACE_DETAIL_MOBILE_FAVORITE_SOON}
          aria-label={PLACE_DETAIL_MOBILE_FAVORITE}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-rose-500 opacity-70 shadow-sm"
        >
          <Heart className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>

        <div className="relative flex min-h-[260px] flex-col justify-end p-4">
          <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-600/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {categoryLabel}
          </span>
          <h1 className="text-2xl font-bold leading-tight text-white">{place.name}</h1>

          {statusLine ? (
            <p className="mt-1.5 text-xs font-medium text-white/90">{statusLine}</p>
          ) : null}

          {statsLine ? (
            <p className="mt-1 text-xs font-medium text-white/85">{statsLine}</p>
          ) : null}

          {photoCount > 0 ? (
            <button
              type="button"
              onClick={onOpenPhotos}
              className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden />
              {PLACE_DETAIL_MOBILE_PHOTOS_CTA(photoCount)}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
