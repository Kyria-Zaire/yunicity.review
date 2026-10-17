"use client";

import { PlaceDesktopDetailView } from "@/components/places/desktop/detail";
import { PlaceMediumDetailView } from "@/components/places/medium/detail";
import { PlaceMobileDetailView } from "@/components/places/mobile";
import { PlacesAppShell } from "@/components/places/places-app-shell";
import type { CulturalPlaceDetail } from "@yunicity/types";

type CulturalPlaceDetailScreenProps = {
  place: CulturalPlaceDetail;
};

export function CulturalPlaceDetailScreen({ place }: CulturalPlaceDetailScreenProps) {
  return (
    <PlacesAppShell>
      <PlaceMobileDetailView place={place} />
      <PlaceMediumDetailView place={place} />
      <PlaceDesktopDetailView place={place} />
    </PlacesAppShell>
  );
}
