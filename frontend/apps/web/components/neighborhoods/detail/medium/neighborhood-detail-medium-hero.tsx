"use client";

import { NeighborhoodDetailHeroMedia } from "@/components/neighborhoods/detail/shared";
import type { EditorialImageCredit } from "@yunicity/utils";
import { NEIGHBORHOOD_DETAIL_MEDIUM_VIEW_PHOTOS } from "@yunicity/utils";

type NeighborhoodDetailMediumHeroProps = {
  title: string;
  imageUrl: string | null;
  galleryUrls: string[];
  imageCredit?: EditorialImageCredit | null;
};

export function NeighborhoodDetailMediumHero({
  title,
  imageUrl,
  galleryUrls,
  imageCredit = null,
}: NeighborhoodDetailMediumHeroProps) {
  return (
    <NeighborhoodDetailHeroMedia
      title={title}
      imageUrl={imageUrl}
      galleryUrls={galleryUrls}
      imageCredit={imageCredit}
      sizes="(min-width: 640px) 960px, 100vw"
      aspectClassName="aspect-[16/9] min-h-[200px]"
      photoLabel={NEIGHBORHOOD_DETAIL_MEDIUM_VIEW_PHOTOS}
      compactPhotoButton
    />
  );
}
