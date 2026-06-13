"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_V2_CREATOR_CTA,
  NEIGHBORHOOD_V2_CREATORS_LABEL,
  NEIGHBORHOOD_V2_LOCAL_LIFE_TITLE,
  NEIGHBORHOOD_V2_TRIBES_LABEL,
  buildCreatorProfileHref,
  hasNeighborhoodV2LocalLife,
  tribeHref,
} from "@yunicity/utils";
import Link from "next/link";

type NeighborhoodV2LocalLifeSectionProps = {
  detail: NeighborhoodDetail;
};

export function NeighborhoodV2LocalLifeSection({ detail }: NeighborhoodV2LocalLifeSectionProps) {
  if (!hasNeighborhoodV2LocalLife(detail)) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-2xl border border-neutral-200/90 bg-white px-5 py-6 shadow-sm sm:px-6">
      <h2 className="text-lg font-bold tracking-tight text-neutral-900">{NEIGHBORHOOD_V2_LOCAL_LIFE_TITLE}</h2>

      {detail.tribes.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {NEIGHBORHOOD_V2_TRIBES_LABEL}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {detail.tribes.map((tribe) => (
              <li key={tribe.id}>
                <Link
                  href={tribeHref(tribe.slug, detail.city)}
                  className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:border-yunicity-primary/40 hover:text-yunicity-primary"
                >
                  {tribe.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {detail.creators.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {NEIGHBORHOOD_V2_CREATORS_LABEL}
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {detail.creators.map((creator) => (
              <li key={creator.id}>
                <Link
                  href={buildCreatorProfileHref(creator.id)}
                  className="group flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/60 p-3 transition hover:border-yunicity-primary/30"
                >
                  {creator.avatar_url ? (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                      <CulturalImage
                        src={creator.avatar_url}
                        alt=""
                        placeName={creator.full_name}
                        className="h-full w-full"
                        sizes="48px"
                        overlay={false}
                        showFallbackCaption={false}
                      />
                    </div>
                  ) : (
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yunicity-primary/10 text-sm font-bold text-yunicity-primary"
                      aria-hidden
                    >
                      {creator.full_name.trim().charAt(0).toUpperCase() || "C"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-neutral-900 group-hover:text-yunicity-primary">
                      {creator.full_name}
                    </p>
                    <p className="text-xs font-semibold text-yunicity-primary">{NEIGHBORHOOD_V2_CREATOR_CTA}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
