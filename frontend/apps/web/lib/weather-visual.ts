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

export type WeatherVisual = { Icon: LucideIcon; type: string };

export type WeatherSurfaceTint = {
  bg: string;
  pill: string;
  icon: string;
};

export function getWeatherVisual(params: {
  icon: string | null;
  condition: string;
  isDay: boolean;
}): WeatherVisual {
  const iconKey = (params.icon ?? "").toLowerCase();
  const condition = params.condition.toLowerCase();

  const byIcon: Record<string, WeatherVisual> = {
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

export function getWeatherSurfaceTint(params: {
  icon: string | null;
  condition: string;
  isDay: boolean;
}): WeatherSurfaceTint {
  const weatherVisual = getWeatherVisual(params);
  const isRainy = weatherVisual.type === "rain";
  const isStorm = weatherVisual.type === "storm";

  if (params.isDay) {
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
}
