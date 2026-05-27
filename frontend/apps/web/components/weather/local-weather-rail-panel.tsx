"use client";

import { WebContextPanel } from "@/components/layout/web-context-panel";
import { useCurrentWeather } from "@/hooks/use-current-weather";
import { HOME_WEATHER_TITLE } from "@yunicity/utils";
import type { LucideIcon } from "lucide-react";
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

type LocalWeatherRailPanelProps = {
  city: string;
  lat?: number | null;
  lon?: number | null;
};

export function LocalWeatherRailPanel({ city, lat = null, lon = null }: LocalWeatherRailPanelProps) {
  const { weather, loading, error } = useCurrentWeather({ city, lat, lon });

  return (
    <WebContextPanel title={HOME_WEATHER_TITLE}>
      {loading ? (
        <p className="text-sm text-neutral-500">Chargement…</p>
      ) : error || !weather ? (
        <p className="text-sm text-neutral-500">Météo indisponible pour le moment.</p>
      ) : (
        <>
          <p className="flex items-center gap-3 text-2xl font-semibold text-neutral-900">
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700"
                  aria-label={weather.condition}
                  title={weather.condition}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              );
            })()}
          </p>
          <p className="mt-1 text-sm text-neutral-600">{weather.condition}</p>
          <p className="text-xs text-neutral-500">{weather.city}</p>
        </>
      )}
    </WebContextPanel>
  );
}
