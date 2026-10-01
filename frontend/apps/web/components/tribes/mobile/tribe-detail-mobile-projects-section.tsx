"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import {
  TRIBE_DETAIL_MOBILE_PROJECTS_EMPTY,
  TRIBE_DETAIL_MOBILE_PROJECTS_TITLE,
} from "@yunicity/utils";

type TribeDetailMobileProjectsSectionProps = {
  imageUrls: string[];
};

export function TribeDetailMobileProjectsSection({ imageUrls }: TribeDetailMobileProjectsSectionProps) {
  return (
    <section className="space-y-3" data-tribe-detail-mobile-projects="">
      <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_MOBILE_PROJECTS_TITLE}</h2>

      {imageUrls.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-600">
          {TRIBE_DETAIL_MOBILE_PROJECTS_EMPTY}
        </p>
      ) : (
        <ul className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {imageUrls.map((url) => (
            <li key={url} className="shrink-0">
              <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-neutral-100">
                <CulturalImage
                  src={url}
                  alt=""
                  placeName=""
                  className="size-full object-cover"
                  sizes="96px"
                  showFallbackCaption={false}
                  overlay={false}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
