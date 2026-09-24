"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import {
  TRIBE_DETAIL_MEDIUM_PROJECTS_EMPTY,
  TRIBE_DETAIL_MEDIUM_PROJECTS_TITLE,
} from "@yunicity/utils";

type TribeDetailMediumProjectsGalleryProps = {
  imageUrls: string[];
};

export function TribeDetailMediumProjectsGallery({ imageUrls }: TribeDetailMediumProjectsGalleryProps) {
  return (
    <section className="space-y-3" data-tribe-detail-medium-projects="">
      <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_MEDIUM_PROJECTS_TITLE}</h2>

      {imageUrls.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-600">
          {TRIBE_DETAIL_MEDIUM_PROJECTS_EMPTY}
        </p>
      ) : (
        <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {imageUrls.map((url) => (
            <li key={url} className="relative h-28 w-36 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-32 sm:w-40">
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
