"use client";

import { NeighborhoodDetailHeroMedia } from "@/components/neighborhoods/detail/shared";
import { NEIGHBORHOOD_DETAIL_MOBILE_VIEW_PHOTOS } from "@yunicity/utils";

type NeighborhoodDetailMobileHeroProps = {
  title: string;
  imageUrl: string | null;
  galleryUrls: string[];
};

export function NeighborhoodDetailMobileHero({
  title,
  imageUrl,
  galleryUrls,
}: NeighborhoodDetailMobileHeroProps) {
  return (
    <NeighborhoodDetailHeroMedia
      title={title}
      imageUrl={imageUrl}
      galleryUrls={galleryUrls}
      sizes="100vw"
      aspectClassName="aspect-[16/10] min-h-[160px]"
      photoLabel={NEIGHBORHOOD_DETAIL_MOBILE_VIEW_PHOTOS}
      compactPhotoButton
      showCaptionOverlay={false}
    />
  );
}
