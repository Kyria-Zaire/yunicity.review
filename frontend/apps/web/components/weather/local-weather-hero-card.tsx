"use client";

import { useCurrentWeather } from "@/hooks/use-current-weather";
import { getWeatherSurfaceTint, getWeatherVisual } from "@/lib/weather-visual";
import { useGeo } from "@/providers/geo-provider";
import { HOME_WEATHER_TITLE, resolveCityMapCenter } from "@yunicity/utils";
import { useMemo } from "react";

type LocalWeatherHeroCardProps = {
  city: string;
  className?: string;
  /** `compact` — bandeau mobile hub Recherche. */
  variant?: "hero" | "compact";
};

export function LocalWeatherHeroCard({
  city,
  className,
  variant = "hero",
}: LocalWeatherHeroCardProps) {
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

  const isCompact = variant === "compact";

  return (
    <article
      className={`flex flex-col justify-between rounded-2xl border border-neutral-200/90 shadow-sm ${
        isCompact
          ? "min-h-0 p-4"
          : "h-full min-h-[200px] rounded-3xl p-5 sm:min-h-[240px]"
      } ${tint.bg} ${className ?? ""}`}
      aria-labelledby="explorer-hero-weather-title"
    >
      <p
        id="explorer-hero-weather-title"
        className="text-xs font-semibold uppercase tracking-wide text-neutral-500"
      >
        {HOME_WEATHER_TITLE}
      </p>

      {loading ? (
        <div className={`space-y-3 ${isCompact ? "py-2" : "py-4"}`} aria-busy="true">
          <div className={`animate-pulse rounded-lg bg-white/70 ${isCompact ? "h-8 w-20" : "h-10 w-24"}`} />
          <div className={`animate-pulse rounded bg-white/60 ${isCompact ? "h-3 w-28" : "h-4 w-32"}`} />
        </div>
      ) : error || !weather ? (
        <p className={`text-sm text-neutral-500 ${isCompact ? "py-2" : "py-4"}`}>
          Météo indisponible pour le moment.
        </p>
      ) : (
        <div className={`flex ${isCompact ? "items-center gap-3 py-1" : "flex-1 flex-col justify-center py-2"}`}>
          <p
            className={`flex items-center gap-2 font-bold tracking-tight text-neutral-900 ${
              isCompact ? "text-2xl" : "gap-3 text-3xl"
            }`}
          >
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
                  className={`inline-flex items-center justify-center rounded-full bg-white/85 shadow-sm ${tint.icon} ${
                    isCompact ? "h-9 w-9" : "h-12 w-12"
                  }`}
                  aria-label={weather.condition}
                  title={weather.condition}
                >
                  <Icon className={isCompact ? "h-5 w-5" : "h-6 w-6"} aria-hidden="true" />
                </span>
              );
            })()}
          </p>
          <div className={isCompact ? "min-w-0 flex-1" : undefined}>
            <p className={`font-medium ${isCompact ? "text-xs" : "mt-2 text-sm"} ${tint.pill}`}>
              {weather.condition}
            </p>
            <p className={`text-neutral-500 ${isCompact ? "text-[11px]" : "mt-1 text-xs"}`}>
              {weather.city}
            </p>
          </div>
        </div>
      )}

      {!isCompact ? (
        <p className="text-[10px] leading-snug text-neutral-400">
          {geo.currentPosition ? "Autour de vous" : `Centre ${city}`}
        </p>
      ) : null}
    </article>
  );
}
