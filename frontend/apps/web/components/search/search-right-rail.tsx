"use client";

import {
  neighborhoodVibeLabel,
  neighborhoodVibeTone,
} from "@/components/home/home-neighborhood-vibe";
import { HomeWeekEventsCalendar } from "@/components/home/home-week-events-calendar";
import { MapTransitNearby } from "@/components/map/map-transit-nearby";
import { WebContextPanel } from "@/components/layout/web-context-panel";
import { useCurrentWeather } from "@/hooks/use-current-weather";
import { useGeo } from "@/providers/geo-provider";
import type { SearchExplorerContextState } from "@/hooks/use-search-explorer-context";
import {
  HOME_EDITORIAL_TAGS,
  HOME_EVENTS_THIS_WEEK,
  HOME_LOCAL_TAGS_TITLE,
  HOME_NEIGHBORHOODS_TITLE,
  HOME_PRIVILEGE_TITLE,
  HOME_VIEW_ALL_NEIGHBORHOODS,
  HOME_WEATHER_TITLE,
  SEARCH_RAIL_TRANSIT_NOTE,
  resolveCityMapCenter,
} from "@yunicity/utils";
import Link from "next/link";
import { useMemo } from "react";
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

function RailSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
      ))}
    </div>
  );
}

const VIBE_CLASS: Record<ReturnType<typeof neighborhoodVibeTone>, string> = {
  active: "bg-yunicity-primary/10 text-yunicity-primary",
  calm: "bg-neutral-100 text-neutral-600",
  discover: "bg-amber-50 text-amber-800",
};

function getWeatherVisual(params: {
  icon: string | null;
  condition: string;
  isDay: boolean;
}): { Icon: LucideIcon; type: string } {
  const iconKey = (params.icon ?? "").toLowerCase();
  const condition = params.condition.toLowerCase();

  const byIcon: Record<string, { Icon: LucideIcon; type: string }> = {
    clear: { Icon: params.isDay ? Sun : Moon, type: "clear" },
    "partly-cloudy": { Icon: params.isDay ? CloudSun : CloudMoon, type: "partly_cloudy" },
    cloudy: { Icon: Cloud, type: "cloudy" },
    fog: { Icon: CloudFog, type: "fog" },
    drizzle: { Icon: CloudRain, type: "rain" },
    rain: { Icon: CloudRain, type: "rain" },
    showers: { Icon: CloudRain, type: "rain" },
    snow: { Icon: CloudSnow, type: "snow" },
    thunderstorm: { Icon: CloudLightning, type: "storm" },
  };

  const exact = byIcon[iconKey];
  if (exact) return exact;

  if (condition.includes("orage")) return { Icon: CloudLightning, type: "storm" };
  if (condition.includes("neige")) return { Icon: CloudSnow, type: "snow" };
  if (condition.includes("pluie") || condition.includes("averse")) {
    return { Icon: CloudRain, type: "rain" };
  }
  if (condition.includes("brouillard")) return { Icon: CloudFog, type: "fog" };
  if (condition.includes("nuage")) return { Icon: Cloud, type: "cloudy" };
  return { Icon: params.isDay ? Sun : Moon, type: "clear" };
}

export function SearchRightRail({ explorer }: { explorer: SearchExplorerContextState }) {
  const { loading, weekEvents, neighborhoods, highlightOffer } = explorer;
  const geo = useGeo();
  const city = geo.currentCity;

  const weatherQueryLatLon = geo.currentPosition
    ? { lat: geo.currentPosition.latitude, lon: geo.currentPosition.longitude }
    : { lat: null, lon: null };

  const { weather, loading: weatherLoading, error: weatherError } = useCurrentWeather({
    city,
    lat: weatherQueryLatLon.lat,
    lon: weatherQueryLatLon.lon,
  });

  const transitPoint = useMemo(() => {
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

  if (loading) {
    return <RailSkeleton />;
  }

  const weatherTint = (() => {
    if (!weather) return { bg: "bg-white", pill: "text-neutral-600", icon: "text-neutral-500" };
    const weatherVisual = getWeatherVisual({
      icon: weather.icon,
      condition: weather.condition,
      isDay: weather.is_day,
    });
    const isRainy = weatherVisual.type === "rain";
    const isStorm = weatherVisual.type === "storm";
    if (weather.is_day) {
      return {
        bg: isStorm
          ? "bg-gradient-to-br from-amber-50 via-white to-orange-100"
          : isRainy
            ? "bg-gradient-to-br from-sky-50 via-white to-yunicity-primary/10"
            : "bg-gradient-to-br from-blue-50 via-white to-yunicity-primary/10",
        pill: "text-neutral-600",
        icon: isStorm ? "text-amber-600" : "text-blue-500",
      };
    }
    return {
      bg: isStorm
        ? "bg-gradient-to-br from-slate-200 via-white to-amber-100"
        : isRainy
          ? "bg-gradient-to-br from-slate-100 via-white to-yunicity-primary/10"
          : "bg-gradient-to-br from-neutral-100 via-white to-yunicity-primary/10",
      pill: "text-neutral-600",
      icon: isStorm ? "text-amber-700" : "text-neutral-600",
    };
  })();

  return (
    <div className="space-y-4">
      {geo.permissionState === "unknown" && !geo.currentPosition ? (
        <WebContextPanel title="Votre position">
          <p className="text-sm text-neutral-600">
            Pour adapter météo et transports à la zone où vous vous trouvez.
          </p>
          <button
            type="button"
            onClick={geo.requestLocation}
            disabled={geo.isRequesting}
            className="mt-2 w-full rounded-full bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-yunicity-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {geo.isRequesting ? "Activation…" : "Utiliser votre position ?"}
          </button>
        </WebContextPanel>
      ) : geo.permissionState !== "granted" && geo.permissionState !== "unknown" ? (
        <WebContextPanel title="Position">
          <p className="text-sm text-neutral-600">
            Position non autorisée. Nous utilisons la ville active.
          </p>
        </WebContextPanel>
      ) : null}

      <div className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ${weatherTint.bg}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{HOME_WEATHER_TITLE}</p>
            {weatherLoading ? (
              <p className="mt-2 text-sm text-neutral-500">Chargement…</p>
            ) : weatherError || !weather ? (
              <p className="mt-2 text-sm text-neutral-500">Météo indisponible pour le moment.</p>
            ) : (
              <>
                <p className="mt-2 flex items-center gap-3 text-2xl font-semibold text-neutral-900">
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
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 ${weatherTint.icon}`}
                        aria-label={weather.condition}
                        title={weather.condition}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    );
                  })()}
                </p>
                <p className={`mt-1 text-sm ${weatherTint.pill}`}>{weather.condition}</p>
                <p className="mt-1 text-xs text-neutral-500">{weather.city}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <MapTransitNearby point={transitPoint} />
      <p className="-mt-2 px-1 text-[10px] text-neutral-400">{SEARCH_RAIL_TRANSIT_NOTE}</p>

      <WebContextPanel title={HOME_EVENTS_THIS_WEEK(city)}>
        <HomeWeekEventsCalendar events={weekEvents} city={city} />
      </WebContextPanel>

      <WebContextPanel title={HOME_NEIGHBORHOODS_TITLE}>
        {neighborhoods.length === 0 ? (
          <p className="text-sm text-neutral-500">Les quartiers de {city} arrivent progressivement.</p>
        ) : (
          <ul className="space-y-2">
            {neighborhoods.slice(0, 4).map((hood) => {
              const vibe = neighborhoodVibeLabel(hood);
              const tone = neighborhoodVibeTone(vibe);
              return (
                <li key={hood.id}>
                  <Link
                    href={`/neighborhoods/${hood.slug}?city=${encodeURIComponent(city)}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
                  >
                    <span className="font-medium text-neutral-800">{hood.display_name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${VIBE_CLASS[tone]}`}
                    >
                      {vibe}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href={`/neighborhoods?city=${encodeURIComponent(city)}`}
          className="inline-block text-xs font-semibold text-yunicity-primary hover:underline"
        >
          {HOME_VIEW_ALL_NEIGHBORHOODS}
        </Link>
      </WebContextPanel>

      {highlightOffer ? (
        <WebContextPanel title={HOME_PRIVILEGE_TITLE}>
          <p className="text-xs font-medium text-yunicity-primary">
            {highlightOffer.organization.name}
          </p>
          <p className="font-semibold text-neutral-900">{highlightOffer.title}</p>
          <Link href="/passport" className="text-xs font-semibold text-yunicity-primary hover:underline">
            Voir l&apos;avantage
          </Link>
        </WebContextPanel>
      ) : null}

      <WebContextPanel title={HOME_LOCAL_TAGS_TITLE}>
        <div className="flex flex-wrap gap-2">
          {HOME_EDITORIAL_TAGS.map((tag) => (
            <Link
              key={tag.slug}
              href={`/search?q=${encodeURIComponent(tag.slug)}&city=${encodeURIComponent(city)}`}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
            >
              {tag.label}
            </Link>
          ))}
        </div>
      </WebContextPanel>
    </div>
  );
}
