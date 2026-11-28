"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import {
  PLACE_DETAIL_DESKTOP_PHOTOS_TITLE,
  PLACE_DETAIL_DESKTOP_PHOTOS_VIEW_ALL,
} from "@yunicity/utils";

type PlaceDesktopDetailPhotosProps = {
  title: string;
  imageUrls: string[];
  onOpenGallery: () => void;
};

export function PlaceDesktopDetailPhotos({
  title,
  imageUrls,
  onOpenGallery,
}: PlaceDesktopDetailPhotosProps) {
  if (imageUrls.length === 0) return null;

  const preview = imageUrls.slice(0, 5);

  return (
    <section className="space-y-3" aria-labelledby="place-desktop-photos-title" data-place-desktop-detail-photos="">
      <div className="flex items-center justify-between gap-3">
        <h2 id="place-desktop-photos-title" className="text-lg font-bold text-neutral-900">
          {PLACE_DETAIL_DESKTOP_PHOTOS_TITLE}
        </h2>
        {imageUrls.length > 1 ? (
          <button
            type="button"
            onClick={onOpenGallery}
            className="text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PLACE_DETAIL_DESKTOP_PHOTOS_VIEW_ALL}
          </button>
        ) : null}
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {preview.map((url, index) => (
          <li key={`${url}-${index}`}>
            <button
              type="button"
              onClick={onOpenGallery}
              className="relative block aspect-square w-full overflow-hidden rounded-xl bg-neutral-200"
            >
              <CulturalImage
                src={url}
                alt=""
                placeName={title}
                className="absolute inset-0 size-full"
                sizes="160px"
                showFallbackCaption={false}
                dimOverlay={false}
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
