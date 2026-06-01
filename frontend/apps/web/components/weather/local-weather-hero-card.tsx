"use client";

import { useCurrentWeather } from "@/hooks/use-current-weather";
import { getWeatherSurfaceTint, getWeatherVisual } from "@/lib/weather-visual";
import { useGeo } from "@/providers/geo-provider";
import { HOME_WEATHER_TITLE, resolveCityMapCenter } from "@yunicity/utils";
import { useMemo } from "react";

type LocalWeatherHeroCardProps = {
  city: string;
  className?: string;
};

export function LocalWeatherHeroCard({ city, className }: LocalWeatherHeroCardProps) {
  const geo = useGeo();

  const coords = useMemo(() => {
    if (geo.currentPosition) {
      return {
        lat: geo.currentPosition.latitude,
        lon: geo.currentPosition.longitude,
      };
    }
    const center = resolveCityMapCenter(city);
    return { lat: center.latitude, lon: center.longitude };
  }, [city, geo.currentPosition]);

  const { weather, loading, error } = useCurrentWeather({
    city,
    lat: coords.lat,
    lon: coords.lon,
  });

  const tint = weather
    ? getWeatherSurfaceTint({
        icon: weather.icon,
        condition: weather.condition,
        isDay: weather.is_day,
      })
    : { bg: "bg-white", pill: "text-neutral-600", icon: "text-neutral-500" };

  return (
    <article
      className={`flex h-full min-h-[200px] flex-col justify-between rounded-3xl border border-neutral-200/90 p-5 shadow-sm sm:min-h-[240px] ${tint.bg} ${className ?? ""}`}
      aria-labelledby="explorer-hero-weather-title"
    >
      <p
        id="explorer-hero-weather-title"
        className="text-xs font-semibold uppercase tracking-wide text-neutral-500"
      >
        {HOME_WEATHER_TITLE}
      </p>

      {loading ? (
        <div className="space-y-3 py-4" aria-busy="true">
          <div className="h-10 w-24 animate-pulse rounded-lg bg-white/70" />
          <div className="h-4 w-32 animate-pulse rounded bg-white/60" />
        </div>
      ) : error || !weather ? (
        <p className="py-4 text-sm text-neutral-500">Météo indisponible pour le moment.</p>
      ) : (
        <div className="flex flex-1 flex-col justify-center py-2">
          <p className="flex items-center gap-3 text-3xl font-bold tracking-tight text-neutral-900">
            <span>{Math.round(weather.temperature)}°C</span>
            {(() => {
              const visual = getWeatherVisual({
                icon: weather.icon,
                condition: weather.condition,
                isDay: weather.is_day,
              });
              const Icon = visual.Icon;
              return (
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/85 shadow-sm ${tint.icon}`}
                  aria-label={weather.condition}
                  title={weather.condition}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
              );
            })()}
          </p>
          <p className={`mt-2 text-sm font-medium ${tint.pill}`}>{weather.condition}</p>
          <p className="mt-1 text-xs text-neutral-500">{weather.city}</p>
        </div>
      )}

      <p className="text-[10px] leading-snug text-neutral-400">
        {geo.currentPosition ? "Autour de vous" : `Centre ${city}`}
      </p>
    </article>
  );
}
