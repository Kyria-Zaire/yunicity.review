"use client";

import { MapTransitNearby } from "@/components/map/map-transit-nearby";
import { WebContextPanel } from "@/components/layout/web-context-panel";
import { EventsTribeChip } from "@/components/events/events-tribe-chip";
import { LocalWeatherRailPanel } from "@/components/weather/local-weather-rail-panel";
import type { EventsAgendaContextState } from "@/hooks/use-events-agenda-context";
import { useCurrentWeather } from "@/hooks/use-current-weather";
import { useAuth } from "@/lib/auth/auth-provider";
import { useGeo } from "@/providers/geo-provider";
import type { LocalEvent } from "@yunicity/types";
import {
  EVENTS_RAIL_CITY_TITLE,
  EVENTS_RAIL_PLANNING_CTA,
  EVENTS_RAIL_PLANNING_CTA_LOGIN,
  EVENTS_RAIL_PLANNING_EMPTY,
  EVENTS_RAIL_PLANNING_TITLE,
  EVENTS_RAIL_PLANNING_VISITOR,
  EVENTS_RAIL_TRIBES_EMPTY,
  EVENTS_RAIL_TRIBES_TITLE,
  EVENTS_RAIL_TRANSIT_TITLE,
  EVENTS_RAIL_VIEW_TRIBES,
  buildCityPulseLine,
  eventCalendarDayKey,
  filterEventsOnDay,
  formatEventClockTime,
  formatTerritorialLine,
  formatEventLocation,
  resolveCityMapCenter,
} from "@yunicity/utils";
import Link from "next/link";
import { useMemo } from "react";

function RailSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
      ))}
    </div>
  );
}

function PlanningItem({ event }: { event: LocalEvent }) {
  const place =
    formatTerritorialLine(event.neighborhood_summary, event.city, event.district) ??
    formatEventLocation(event, event.city);

  return (
    <Link
      href={`/events/${event.id}`}
      className="block rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 transition hover:border-neutral-200 hover:bg-white"
    >
      <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{event.title}</p>
      <p className="mt-0.5 text-xs font-medium text-yunicity-primary tabular-nums">
        {formatEventClockTime(event.starts_at)}
      </p>
      <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{place}</p>
    </Link>
  );
}

function VisitorPlanningEmpty() {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-neutral-600">{EVENTS_RAIL_PLANNING_VISITOR}</p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/login"
          className="inline-flex rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
        >
          {EVENTS_RAIL_PLANNING_CTA_LOGIN}
        </Link>
        <Link
          href="/login"
          className="inline-flex rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-yunicity-primary transition hover:border-yunicity-primary/30"
        >
          {EVENTS_RAIL_PLANNING_CTA}
        </Link>
      </div>
    </div>
  );
}

type EventsRightRailProps = {
  context: EventsAgendaContextState;
};

export function EventsRightRail({ context }: EventsRightRailProps) {
  const { user } = useAuth();
  const geo = useGeo();
  const { loading, city, savedEvents, tribes, neighborhoods, events } = context;

  const weatherLat = geo.currentPosition?.latitude ?? null;
  const weatherLon = geo.currentPosition?.longitude ?? null;

  const { weather } = useCurrentWeather({ city, lat: weatherLat, lon: weatherLon });

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

  const cityPulse = useMemo(() => {
    const todayKey = eventCalendarDayKey(new Date().toISOString());
    const tonight = filterEventsOnDay(events, todayKey).filter((event) => {
      const hour = new Date(event.starts_at).getHours();
      return hour >= 18;
    }).length;
    const primaryAmbiance = neighborhoods[0]?.ambiance ?? null;
    const weatherCalm =
      !weather ||
      ["clear", "partly-cloudy", "cloudy", "fog"].includes((weather.icon ?? "").toLowerCase());
    return buildCityPulseLine({
      city,
      eventsTonight: tonight,
      eventsThisWeek: events.length,
      neighborhoodAmbiance: primaryAmbiance,
      weatherCalm,
    });
  }, [city, events, neighborhoods, weather]);

  const planningEvents = savedEvents.slice(0, 4);
  const visibleTribes = tribes.slice(0, 3);

  if (loading) {
    return <RailSkeleton />;
  }

  return (
    <div className="space-y-4">
      <WebContextPanel title={EVENTS_RAIL_PLANNING_TITLE}>
        {!user ? (
          <VisitorPlanningEmpty />
        ) : planningEvents.length === 0 ? (
          <p className="text-sm text-neutral-500">{EVENTS_RAIL_PLANNING_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {planningEvents.map((event) => (
              <li key={event.id}>
                <PlanningItem event={event} />
              </li>
            ))}
          </ul>
        )}
      </WebContextPanel>

      <LocalWeatherRailPanel city={city} lat={weatherLat} lon={weatherLon} />

      <WebContextPanel title={EVENTS_RAIL_TRIBES_TITLE}>
        {visibleTribes.length === 0 ? (
          <p className="text-sm text-neutral-500">{EVENTS_RAIL_TRIBES_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {visibleTribes.map((tribe) => (
              <li key={tribe.slug}>
                <EventsTribeChip tribe={tribe} city={city} compact />
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/search?tab=tribes&city=${encodeURIComponent(city)}`}
          className="mt-2 inline-block text-xs font-semibold text-yunicity-primary hover:underline"
        >
          {EVENTS_RAIL_VIEW_TRIBES}
        </Link>
      </WebContextPanel>

      <MapTransitNearby point={transitPoint} title={EVENTS_RAIL_TRANSIT_TITLE} />

      <WebContextPanel title={EVENTS_RAIL_CITY_TITLE}>
        <p className="text-sm leading-relaxed text-neutral-500">{cityPulse}</p>
      </WebContextPanel>
    </div>
  );
}
