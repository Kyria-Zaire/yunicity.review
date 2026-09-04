"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import {
  TRIBE_DETAIL_DESKTOP_PROJECTS_EMPTY,
  TRIBE_DETAIL_DESKTOP_PROJECTS_TITLE,
} from "@yunicity/utils";

type TribeDetailDesktopProjectsGalleryProps = {
  imageUrls: string[];
};

export function TribeDetailDesktopProjectsGallery({ imageUrls }: TribeDetailDesktopProjectsGalleryProps) {
  return (
    <section className="space-y-3" data-tribe-detail-projects="">
      <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_DESKTOP_PROJECTS_TITLE}</h2>

      {imageUrls.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-600">
          {TRIBE_DETAIL_DESKTOP_PROJECTS_EMPTY}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {imageUrls.map((url) => (
            <li key={url} className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
              <CulturalImage
                src={url}
                alt=""
                placeName="Projet"
                className="size-full object-cover"
                sizes="160px"
                showFallbackCaption={false}
                overlay={false}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
