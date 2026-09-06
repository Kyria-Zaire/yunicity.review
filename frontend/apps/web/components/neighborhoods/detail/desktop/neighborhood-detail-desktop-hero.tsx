"use client";

import { NeighborhoodDetailHeroMedia } from "@/components/neighborhoods/detail/shared";
import type { EditorialImageCredit } from "@yunicity/utils";
import { NEIGHBORHOOD_DETAIL_DESKTOP_VIEW_PHOTOS } from "@yunicity/utils";

type NeighborhoodDetailDesktopHeroProps = {
  title: string;
  imageUrl: string | null;
  galleryUrls: string[];
  imageCredit?: EditorialImageCredit | null;
};

export function NeighborhoodDetailDesktopHero({
  title,
  imageUrl,
  galleryUrls,
  imageCredit = null,
}: NeighborhoodDetailDesktopHeroProps) {
  return (
    <NeighborhoodDetailHeroMedia
      title={title}
      imageUrl={imageUrl}
      galleryUrls={galleryUrls}
      imageCredit={imageCredit}
      sizes="(min-width: 1024px) 900px, 100vw"
      aspectClassName="aspect-[21/9] min-h-[220px]"
      photoLabel={NEIGHBORHOOD_DETAIL_DESKTOP_VIEW_PHOTOS}
    />
  );
}
