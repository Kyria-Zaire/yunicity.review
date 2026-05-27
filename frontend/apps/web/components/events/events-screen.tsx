"use client";

import { EventsAgendaHero } from "@/components/events/events-agenda-hero";
import { EventsFeaturedCarousel } from "@/components/events/events-featured-carousel";
import { EventsMomentCard } from "@/components/events/events-moment-card";
import { EventsNeighborhoodAtmosphere } from "@/components/events/events-neighborhood-atmosphere";
import { EventsRightRail } from "@/components/events/events-right-rail";
import { EventsWeekNav } from "@/components/events/events-week-nav";
import { WebAppShell } from "@/components/layout";
import { useEventsAgendaContext } from "@/hooks/use-events-agenda-context";
import { useAuth } from "@/lib/auth/auth-provider";
import { GeoProvider, useGeo } from "@/providers/geo-provider";
import { useCurrentWeather } from "@/hooks/use-current-weather";
import type { AgendaTimeSlot } from "@yunicity/utils";
import {
  EVENTS_AGENDA_EMPTY_DAY,
  EVENTS_AGENDA_ERROR,
  EVENTS_AGENDA_LOADING,
  EVENTS_AGENDA_MOMENTS_SUBTITLE,
  EVENTS_AGENDA_MOMENTS_TITLE,
  EVENTS_AGENDA_RETRY,
  EVENTS_AGENDA_WEEK_SUBTITLE,
  AGENDA_CALENDAR_SPAN_DAYS,
  buildAgendaWeekDays,
  buildFeaturedCarouselItems,
  buildNeighborhoodAtmosphereItems,
  defaultAgendaDayKey,
  filterAgendaHeroEvents,
  filterEventsOnDay,
} from "@yunicity/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function EventsScreenInner() {
  const { user } = useAuth();
  const geo = useGeo();
  const agenda = useEventsAgendaContext(user?.city ?? "Reims");
  const { weather } = useCurrentWeather({
    city: agenda.city,
    lat: geo.currentPosition?.latitude ?? null,
    lon: geo.currentPosition?.longitude ?? null,
  });

  const [theme, setTheme] = useState("");
  const [timeSlot, setTimeSlot] = useState<AgendaTimeSlot>("");
  const [heroApplied, setHeroApplied] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState("");

  const weekDays = useMemo(() => buildAgendaWeekDays(new Date(), AGENDA_CALENDAR_SPAN_DAYS), []);

  useEffect(() => {
    if (agenda.loading || selectedDayKey) return;
    setSelectedDayKey(defaultAgendaDayKey(agenda.events, weekDays));
  }, [agenda.events, agenda.loading, selectedDayKey, weekDays]);

  const filteredEvents = useMemo(() => {
    if (!heroApplied) return agenda.events;
    return filterAgendaHeroEvents(agenda.events, { query: theme, timeSlot, theme });
  }, [agenda.events, heroApplied, theme, timeSlot]);

  const dayEvents = useMemo(() => {
    const onDay = filterEventsOnDay(filteredEvents, selectedDayKey);
    return [...onDay].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  }, [filteredEvents, selectedDayKey]);

  const featuredItems = useMemo(
    () =>
      buildFeaturedCarouselItems({
        city: agenda.city,
        events: agenda.events,
        culturalPlaces: agenda.culturalPlaces,
        passportOffers: agenda.passportOffers,
        tribes: agenda.tribes,
      }),
    [agenda.city, agenda.events, agenda.culturalPlaces, agenda.passportOffers, agenda.tribes],
  );

  const weatherCalm = useMemo(
    () =>
      !weather ||
      ["clear", "partly-cloudy", "cloudy", "fog"].includes((weather.icon ?? "").toLowerCase()),
    [weather],
  );

  const neighborhoodAtmosphereItems = useMemo(
    () =>
      buildNeighborhoodAtmosphereItems({
        city: agenda.city,
        neighborhoods: agenda.neighborhoods,
        events: agenda.events,
        culturalPlaces: agenda.culturalPlaces,
        tribes: agenda.tribes,
        passportOffers: agenda.passportOffers,
        weatherCalm,
      }),
    [
      agenda.city,
      agenda.culturalPlaces,
      agenda.events,
      agenda.neighborhoods,
      agenda.passportOffers,
      agenda.tribes,
      weatherCalm,
    ],
  );

  function handleInterestChange(_eventId: string, interested: boolean) {
    if (!interested) return;
    agenda.reload();
  }

  return (
    <WebAppShell contentWidth="wide" context={<EventsRightRail context={agenda} />}>
      <div className="space-y-8 pb-10">
        <EventsAgendaHero
          city={agenda.city}
          theme={theme}
          timeSlot={timeSlot}
          onThemeChange={setTheme}
          onTimeSlotChange={setTimeSlot}
          onSubmit={() => setHeroApplied(true)}
        />

        {selectedDayKey ? (
          <EventsWeekNav
            days={weekDays}
            selectedKey={selectedDayKey}
            onSelect={setSelectedDayKey}
            subtitle={EVENTS_AGENDA_WEEK_SUBTITLE(agenda.city)}
            headerAction={
              <Link
                href="/map"
                className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-yunicity-primary hover:border-yunicity-primary/40 sm:text-sm"
              >
                Voir la carte
              </Link>
            }
          />
        ) : null}

        {agenda.loading ? (
          <p className="text-neutral-500">{EVENTS_AGENDA_LOADING}</p>
        ) : null}

        {agenda.error ? (
          <div className="space-y-3">
            <p className="text-sm text-red-600">{EVENTS_AGENDA_ERROR}</p>
            <button
              type="button"
              onClick={() => agenda.reload()}
              className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
            >
              {EVENTS_AGENDA_RETRY}
            </button>
          </div>
        ) : null}

        {!agenda.loading && !agenda.error ? (
          <>
            <section className="space-y-4">
              <header>
                <h2 className="text-xl font-bold text-neutral-900">
                  {EVENTS_AGENDA_MOMENTS_TITLE}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">{EVENTS_AGENDA_MOMENTS_SUBTITLE}</p>
              </header>

              {dayEvents.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-8 text-center text-sm text-neutral-500">
                  {EVENTS_AGENDA_EMPTY_DAY}
                </p>
              ) : (
                <ul className="space-y-4">
                  {dayEvents.map((event) => (
                    <li key={event.id}>
                      <EventsMomentCard
                        event={event}
                        culturalPlaces={agenda.culturalPlaces}
                        onInterestChange={handleInterestChange}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <EventsFeaturedCarousel items={featuredItems} />

            <EventsNeighborhoodAtmosphere items={neighborhoodAtmosphereItems} />
          </>
        ) : null}
      </div>
    </WebAppShell>
  );
}

export function EventsScreen() {
  const { user } = useAuth();
  const defaultCity = user?.city?.trim() || "Reims";

  return (
    <GeoProvider defaultCity={defaultCity}>
      <EventsScreenInner />
    </GeoProvider>
  );
}
