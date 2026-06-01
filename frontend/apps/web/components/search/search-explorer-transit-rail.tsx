"use client";

import { TransitNearbyCarouselRail } from "@/components/map/transit-nearby-carousel-rail";
import { useGeo } from "@/providers/geo-provider";
import { MAP_RAIL_TRANSIT_TITLE, MAP_TRANSIT_EMPTY, resolveCityMapCenter } from "@yunicity/utils";
import { useMemo } from "react";

type SearchExplorerTransitRailProps = {
  city: string;
};

export function SearchExplorerTransitRail({ city }: SearchExplorerTransitRailProps) {
  const geo = useGeo();

  const point = useMemo(() => {
    if (geo.currentPosition) {
      return {
        lat: geo.currentPosition.latitude,
        lon: geo.currentPosition.longitude,
        city,
      };
    }
    const center = resolveCityMapCenter(city);
    return { lat: center.latitude, lon: center.longitude, city };
  }, [city, geo.currentPosition]);

  return (
    <TransitNearbyCarouselRail
      point={point}
      title={MAP_RAIL_TRANSIT_TITLE}
      emptyMessage={MAP_TRANSIT_EMPTY}
    />
  );
}
