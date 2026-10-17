"use client";

import { PlaceMobileDetailShell } from "@/components/places/mobile/detail/place-mobile-detail-shell";
import type { CulturalPlaceDetail } from "@yunicity/types";

type PlaceMobileDetailViewProps = {
  place: CulturalPlaceDetail;
};

/** Vue mobile détail lieu (MOBILE-LIEUX-DETAIL-01). */
export function PlaceMobileDetailView({ place }: PlaceMobileDetailViewProps) {
  return <PlaceMobileDetailShell place={place} />;
}
