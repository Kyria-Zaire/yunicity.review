"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import {
  PLACE_DETAIL_MOBILE_PHOTOS_TITLE,
  PLACE_DETAIL_MOBILE_PHOTOS_VIEW_ALL,
} from "@yunicity/utils";

type PlaceMobileDetailPhotosRailProps = {
  title: string;
  imageUrls: string[];
  onOpenGallery: () => void;
};

export function PlaceMobileDetailPhotosRail({
  title,
  imageUrls,
  onOpenGallery,
}: PlaceMobileDetailPhotosRailProps) {
  if (imageUrls.length === 0) return null;

  const preview = imageUrls.slice(0, 6);

  return (
    <section className="space-y-3" aria-labelledby="place-mobile-photos-title" data-place-mobile-detail-photos="">
      <div className="flex items-center justify-between gap-3">
        <h2 id="place-mobile-photos-title" className="text-sm font-bold text-neutral-900">
          {PLACE_DETAIL_MOBILE_PHOTOS_TITLE}
        </h2>
        {imageUrls.length > 1 ? (
          <button
            type="button"
            onClick={onOpenGallery}
            className="text-xs font-semibold text-yunicity-primary"
          >
            {PLACE_DETAIL_MOBILE_PHOTOS_VIEW_ALL}
          </button>
        ) : null}
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-2">
          {preview.map((url, index) => (
            <li key={`${url}-${index}`}>
              <button
                type="button"
                onClick={onOpenGallery}
                className="relative block h-24 w-32 overflow-hidden rounded-xl bg-neutral-200"
              >
                <CulturalImage
                  src={url}
                  alt=""
                  placeName={title}
                  className="absolute inset-0 size-full"
                  sizes="128px"
                  showFallbackCaption={false}
                  dimOverlay={false}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
