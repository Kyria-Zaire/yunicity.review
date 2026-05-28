"use client";

import { NeighborhoodDetailAtmosphere } from "@/components/neighborhoods/neighborhood-detail-atmosphere";
import { NeighborhoodDetailHero } from "@/components/neighborhoods/neighborhood-detail-hero";
import { NeighborhoodDetailLocalLife } from "@/components/neighborhoods/neighborhood-detail-local-life";
import { NeighborhoodDetailMapBlock } from "@/components/neighborhoods/neighborhood-detail-map-block";
import { NeighborhoodDetailMoments } from "@/components/neighborhoods/neighborhood-detail-moments";
import { NeighborhoodDetailPlaces } from "@/components/neighborhoods/neighborhood-detail-places";
import { NeighborhoodDetailRightRail } from "@/components/neighborhoods/neighborhood-detail-right-rail";
import { WebAppShell } from "@/components/layout";
import { useNeighborhoodDetailContext } from "@/hooks/use-neighborhood-detail-context";
import { useCurrentWeather } from "@/hooks/use-current-weather";
import {
  NEIGHBORHOOD_DETAIL_LOADING,
  NEIGHBORHOOD_DETAIL_RETRY,
  NEIGHBORHOOD_NOT_FOUND,
} from "@yunicity/utils";
import Link from "next/link";
import { useEffect, useMemo } from "react";

export function NeighborhoodDetailScreen({ slug, city }: { slug: string; city: string }) {
  const context = useNeighborhoodDetailContext(slug, city);
  const hood = context.hood;

  const weatherLat = hood?.latitude ?? null;
  const weatherLon = hood?.longitude ?? null;

  const { weather } = useCurrentWeather({
    city: context.city,
    lat: weatherLat,
    lon: weatherLon,
  });

  const setWeatherCalm = context.setWeatherCalm;

  useEffect(() => {
    const calm =
      !weather ||
      ["clear", "partly-cloudy", "cloudy", "fog"].includes((weather.icon ?? "").toLowerCase());
    setWeatherCalm(calm);
  }, [setWeatherCalm, weather]);

  const weatherLabel = useMemo(() => {
    if (!weather) return null;
    const temp =
      weather.temperature != null ? `${Math.round(weather.temperature)}°` : null;
    const desc = weather.condition?.trim();
    if (temp && desc) return `${temp} · ${desc}`;
    return temp ?? desc ?? null;
  }, [weather]);

  return (
    <WebAppShell
      contentWidth="wide"
      context={
        hood ? (
          <NeighborhoodDetailRightRail
            context={context}
            hood={hood}
            weatherLat={weatherLat}
            weatherLon={weatherLon}
          />
        ) : null
      }
    >
      <div className="space-y-8 pb-12">
        <nav className="text-sm text-neutral-500">
          <Link
            href={`/neighborhoods?city=${encodeURIComponent(context.city)}`}
            className="font-medium text-yunicity-primary hover:underline"
          >
            ← Quartiers
          </Link>
        </nav>

        {context.loading ? (
          <p className="text-neutral-500">{NEIGHBORHOOD_DETAIL_LOADING}</p>
        ) : null}

        {context.error || (!context.loading && !hood) ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
            <p className="text-red-800">{NEIGHBORHOOD_NOT_FOUND}</p>
            <button
              type="button"
              onClick={() => context.reload()}
              className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {NEIGHBORHOOD_DETAIL_RETRY}
            </button>
          </div>
        ) : null}

        {hood ? (
          <>
            <NeighborhoodDetailHero hood={hood} weatherLabel={weatherLabel} />

            <NeighborhoodDetailAtmosphere line={context.atmosphereLine} />

            <NeighborhoodDetailMoments
              events={context.upcomingEvents}
              culturalPlaces={context.cityCulturalPlaces}
            />

            <NeighborhoodDetailPlaces places={context.hoodCulturalPlaces} city={context.city} />

            <NeighborhoodDetailLocalLife
              tribes={context.tribes}
              organizations={context.context?.organizations ?? []}
              city={context.city}
            />

            <NeighborhoodDetailMapBlock hood={hood} />
          </>
        ) : null}
      </div>
    </WebAppShell>
  );
}
