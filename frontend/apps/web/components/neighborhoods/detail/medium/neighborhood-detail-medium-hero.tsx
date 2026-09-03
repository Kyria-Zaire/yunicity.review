"use client";

import { NeighborhoodDetailHeroMedia } from "@/components/neighborhoods/detail/shared";
import { NEIGHBORHOOD_DETAIL_MEDIUM_VIEW_PHOTOS } from "@yunicity/utils";

type NeighborhoodDetailMediumHeroProps = {
  title: string;
  imageUrl: string | null;
  galleryUrls: string[];
};

export function NeighborhoodDetailMediumHero({
  title,
  imageUrl,
  galleryUrls,
}: NeighborhoodDetailMediumHeroProps) {
  return (
    <NeighborhoodDetailHeroMedia
      title={title}
      imageUrl={imageUrl}
      galleryUrls={galleryUrls}
      sizes="(min-width: 640px) 960px, 100vw"
      aspectClassName="aspect-[16/9] min-h-[200px]"
      photoLabel={NEIGHBORHOOD_DETAIL_MEDIUM_VIEW_PHOTOS}
      compactPhotoButton
    />
  );
}
