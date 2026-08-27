"use client";

import { getWeatherVisual } from "@/lib/weather-visual";
import { useCurrentWeather } from "@/hooks/use-current-weather";
import { useVisibleActivation } from "@/hooks/use-visible-activation";

/**
 * D1.2-R3A — meteo reelle du rail gauche Desktop (>=1536px).
 *
 * Deux garanties structurelles :
 *
 * 1. Le hook `useCurrentWeather` vit dans `WeatherCardContent`, monte UNIQUEMENT
 *    apres activation par visibilite. Le slot est `display:none` sous 1536px,
 *    n'intersecte donc jamais, et aucune requete ne part.
 *
 * 2. La provenance fait foi : `source === "development_stub"` designe la preview
 *    locale du backend, dont les degres sont FABRIQUES. On n'affiche alors
 *    aucune valeur — seulement un etat honnete « Météo indisponible ».
 */

const WEATHER_UNAVAILABLE = "Météo indisponible";

function WeatherShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      data-feed-weather-card=""
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
    >
      <h2 className="text-sm font-bold text-neutral-900">Météo</h2>
      {children}
    </section>
  );
}

function WeatherUnavailable() {
  return (
    <WeatherShell>
      <p data-feed-weather-state="unavailable" className="mt-2 text-sm text-neutral-500">
        {WEATHER_UNAVAILABLE}
      </p>
    </WeatherShell>
  );
}

function WeatherCardContent({ city }: { city: string }) {
  const { weather, loading, error } = useCurrentWeather({ city });

  if (loading) {
    return (
      <WeatherShell>
        <div
          data-feed-weather-state="loading"
          aria-hidden="true"
          className="mt-3 h-14 animate-pulse rounded-xl bg-neutral-100"
        />
        <span className="sr-only">Chargement de la météo</span>
      </WeatherShell>
    );
  }

  // Erreur reseau, 503 provider, ou reponse absente.
  if (error || !weather) return <WeatherUnavailable />;

  // Preview locale du backend : ses degres ne sont pas une meteo reelle.
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

  return (
    <WeatherShell>
      <div data-feed-weather-state="provider" className="mt-2 flex items-center gap-3">
        <Icon className="h-8 w-8 shrink-0 text-yunicity-primary" aria-hidden="true" />
        <p className="text-2xl font-bold leading-none text-neutral-900">
          {temperature}
          <span aria-hidden="true"> °C</span>
          <span className="sr-only"> degrés Celsius</span>
        </p>
      </div>
      <p className="mt-2 text-sm capitalize text-neutral-700">{weather.condition}</p>
      <p className="mt-1 text-xs text-neutral-500">
        Ressenti {feelsLike}
        <span aria-hidden="true"> °C</span>
        <span className="sr-only"> degrés Celsius</span>
      </p>
      {min !== null && max !== null ? (
        <p className="mt-1 text-xs text-neutral-500">
          Min {min}
          <span aria-hidden="true"> °C</span> · Max {max}
          <span aria-hidden="true"> °C</span>
        </p>
      ) : null}
      {wind !== null ? (
        <p className="mt-1 text-xs text-neutral-500">Vent {wind} km/h</p>
      ) : null}
      <p className="mt-2 text-xs text-neutral-400">{weather.city}</p>
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
