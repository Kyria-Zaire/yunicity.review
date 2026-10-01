"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { Tribe } from "@yunicity/types";
import {
  TRIBE_DETAIL_MOBILE_BADGE_FEATURED,
  TRIBE_DETAIL_MOBILE_BADGE_PRIVATE,
  TRIBE_DETAIL_MOBILE_BADGE_PUBLIC,
  resolveTribeHeroImage,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";

type TribeDetailMobileHeroProps = {
  tribe: Tribe;
  tags: string[];
  locationMeta: string;
};

export function TribeDetailMobileHero({ tribe, tags, locationMeta }: TribeDetailMobileHeroProps) {
  const imageUrl = resolveTribeHeroImage(tribe);
  const isPublic = tribe.visibility === "public";

  const badge = tribe.is_featured
    ? TRIBE_DETAIL_MOBILE_BADGE_FEATURED
    : isPublic
      ? TRIBE_DETAIL_MOBILE_BADGE_PUBLIC
      : TRIBE_DETAIL_MOBILE_BADGE_PRIVATE;

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
      <div className="relative aspect-[16/9] min-h-[180px] bg-neutral-100">
        {imageUrl ? (
          <CulturalImage
            src={imageUrl}
            alt={tribe.name}
            placeName={tribe.name}
            className="absolute inset-0 size-full"
            imageClassName="object-cover object-center"
            sizes="100vw"
            priority
            showFallbackCaption={false}
            overlay={false}
          />
        ) : null}
      </div>

      <div className="relative px-4 pb-5 pt-0">
        <div className="relative -mt-10 mb-3">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-neutral-100 shadow-md">
            <CulturalImage
              src={imageUrl}
              alt={tribe.name}
              placeName={tribe.name}
              className="size-full"
              sizes="80px"
              showFallbackCaption={false}
              overlay={false}
            />
          </div>
        </div>

        <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-800">
          {badge}
        </p>

        <h2 className="mt-2 text-xl font-bold leading-tight text-neutral-900">{tribe.name}</h2>

        {tribe.description?.trim() ? (
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{tribe.description.trim()}</p>
        ) : null}

        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-neutral-500">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {locationMeta}
        </p>

        {tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
