"use client";

import { NeighborhoodDetailHeroMedia } from "@/components/neighborhoods/detail/shared";
import { NEIGHBORHOOD_DETAIL_DESKTOP_VIEW_PHOTOS } from "@yunicity/utils";

type NeighborhoodDetailDesktopHeroProps = {
  title: string;
  imageUrl: string | null;
  galleryUrls: string[];
};

export function NeighborhoodDetailDesktopHero({
  title,
  imageUrl,
  galleryUrls,
}: NeighborhoodDetailDesktopHeroProps) {
  return (
    <NeighborhoodDetailHeroMedia
      title={title}
      imageUrl={imageUrl}
      galleryUrls={galleryUrls}
      sizes="(min-width: 1024px) 900px, 100vw"
      aspectClassName="aspect-[21/9] min-h-[220px]"
      photoLabel={NEIGHBORHOOD_DETAIL_DESKTOP_VIEW_PHOTOS}
    />
  );
}
