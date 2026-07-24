"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_V2_LANDMARKS_TITLE,
  NEIGHBORHOOD_V2_PHOTO_CREDIT_PREFIX,
  listNeighborhoodV2Landmarks,
} from "@yunicity/utils";

type NeighborhoodV2LandmarksSectionProps = {
  detail: NeighborhoodDetail;
};

/**
 * Lieux emblématiques (landmarks 3e) — image + crédit. Le crédit CC BY-SA est affiché avec
 * chaque photo réutilisée (obligation d'attribution). Vide → section masquée.
 */
export function NeighborhoodV2LandmarksSection({ detail }: NeighborhoodV2LandmarksSectionProps) {
  const landmarks = listNeighborhoodV2Landmarks(detail);
  if (landmarks.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5 rounded-2xl border border-neutral-200/90 bg-white px-5 py-6 shadow-sm sm:px-6">
      <h2 className="text-lg font-bold tracking-tight text-neutral-900">
        {NEIGHBORHOOD_V2_LANDMARKS_TITLE}
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {landmarks.map((landmark) => (
          <li
            key={landmark.slug}
            className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50/60"
          >
            <div className="relative aspect-[16/10] w-full bg-neutral-200">
              {landmark.hero_image_url ? (
                <CulturalImage
                  src={landmark.hero_image_url}
                  alt={landmark.name}
                  placeName={landmark.name}
                  className="absolute inset-0 h-full w-full"
                  sizes="(max-width: 640px) 100vw, 520px"
                  overlay={false}
                  showFallbackCaption={false}
                />
              ) : (
                <div className="absolute inset-0 bg-neutral-200" />
              )}
            </div>
            <div className="space-y-1 p-4">
              <p className="text-sm font-bold text-neutral-900">{landmark.name}</p>
              {landmark.photo_credit ? (
                <p className="text-[11px] leading-snug text-neutral-500">
                  {NEIGHBORHOOD_V2_PHOTO_CREDIT_PREFIX} {landmark.photo_credit}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
