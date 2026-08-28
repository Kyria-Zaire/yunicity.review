"use client";

import { getWeatherVisual } from "@/lib/weather-visual";
import { resolveFeedCityHighlightImage } from "@/lib/feed/feed-city-highlight";
import { useCurrentWeather } from "@/hooks/use-current-weather";
import { useVisibleActivation } from "@/hooks/use-visible-activation";
import { ArrowDown, ArrowUp, Wind } from "lucide-react";
import Image from "next/image";

/**
 * D1.2-R3A — météo reelle du rail gauche Desktop (>=1536px).
 */

const WEATHER_UNAVAILABLE = "Météo indisponible";

function formatWeatherDate(now: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(now);
}

function weatherCaption(condition: string): string | null {
  const normalized = condition.trim().toLowerCase();
  if (normalized.includes("ensoleill") || normalized.includes("clair")) {
    return "Belle journée pour profiter de la ville ☀️";
  }
  if (normalized.includes("pluie") || normalized.includes("averse")) {
    return "Bon moment pour les adresses couvertes ☔";
  }
  return null;
}

function WeatherShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      data-feed-weather-card=""
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
    >
      {children}
    </section>
  );
}

function WeatherUnavailable() {
  return (
    <WeatherShell>
      <div className="p-4">
        <p data-feed-weather-state="unavailable" className="text-sm text-neutral-500">
          {WEATHER_UNAVAILABLE}
        </p>
      </div>
    </WeatherShell>
  );
}

function WeatherCardContent({ city }: { city: string }) {
  const { weather, loading, error } = useCurrentWeather({ city });
  const cityImage = resolveFeedCityHighlightImage(city);
  const today = formatWeatherDate(new Date());

  if (loading) {
    return (
      <WeatherShell>
        <div className="p-4">
          <div
            data-feed-weather-state="loading"
            aria-hidden="true"
            className="h-40 animate-pulse rounded-xl bg-neutral-100"
          />
          <span className="sr-only">Chargement de la météo</span>
        </div>
      </WeatherShell>
    );
  }

  if (error || !weather) return <WeatherUnavailable />;
  if (weather.source !== "provider") return <WeatherUnavailable />;

  const { Icon } = getWeatherVisual({
    icon: weather.icon,
    condition: weather.condition,
    isDay: weather.is_day,
  });

  const temperature = Math.round(weather.temperature);
  const feelsLike = Math.round(weather.feels_like);
  const min =
    typeof weather.temperature_min === "number" ? Math.round(weather.temperature_min) : null;
  const max =
    typeof weather.temperature_max === "number" ? Math.round(weather.temperature_max) : null;
  const wind = typeof weather.wind_speed === "number" ? Math.round(weather.wind_speed * 3.6) : null;
  const caption = weatherCaption(weather.condition);

  return (
    <WeatherShell>
      <div data-feed-weather-state="provider" className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon className="h-7 w-7 shrink-0 text-yunicity-primary" aria-hidden="true" />
            <p className="text-3xl font-bold leading-none text-neutral-900">
              {temperature}
              <span aria-hidden="true">°</span>
              <span className="sr-only"> degrés Celsius</span>
            </p>
          </div>
          <p className="text-right text-sm capitalize text-neutral-600">{weather.condition}</p>
        </div>

        <p className="mt-3 text-sm font-semibold text-neutral-900">
          {city} · {today}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">
          Ressenti {feelsLike}
          <span aria-hidden="true">°</span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
          {min !== null && max !== null ? (
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5 text-red-500">
                <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                {max}°
              </span>
              <span className="inline-flex items-center gap-0.5 text-yunicity-primary">
                <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                {min}°
              </span>
            </span>
          ) : null}
          {wind !== null ? (
            <span className="inline-flex items-center gap-1">
              <Wind className="h-3.5 w-3.5" aria-hidden />
              {wind} km/h
            </span>
          ) : null}
        </div>
      </div>

      {cityImage ? (
        <div className="relative mx-4 mb-4 overflow-hidden rounded-xl">
          <Image
            src={cityImage}
            alt=""
            width={400}
            height={160}
            sizes="(min-width: 1280px) 224px, 100vw"
            className="h-28 w-full object-cover"
          />
          {caption ? (
            <p className="bg-neutral-50 px-3 py-2.5 text-xs leading-relaxed text-neutral-600">
              {caption}
            </p>
          ) : null}
        </div>
      ) : caption ? (
        <p className="border-t border-neutral-100 px-4 py-3 text-xs leading-relaxed text-neutral-600">
          {caption}
        </p>
      ) : null}
    </WeatherShell>
  );
}

export function FeedWeatherCard({ city }: { city: string }) {
  const { ref, activated } = useVisibleActivation<HTMLDivElement>();

  return (
    <div ref={ref} data-feed-weather-slot="" className="feed-weather-slot">
      {activated ? <WeatherCardContent city={city} /> : null}
    </div>
  );
}
