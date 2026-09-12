"use client";

import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOfferPublic,
  ProfileMe,
  StoryRingItem,
  Tribe,
} from "@yunicity/types";
import { filterAgendaUpcomingEvents, isEventWithinDays } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

export type FeedPortalContextState = {
  city: string;
  loading: boolean;
  profile: ProfileMe | null;
  events: LocalEvent[];
  /**
   * La liste d'evenements a echoue. `events: []` seul ne suffit pas : une panne
   * reseau et une ville sans evenement produisent le meme tableau vide, et le
   * module Evenements doit distinguer « rien ce soir » de « on n'a pas pu
   * charger » (FEED-MAIN-LAYOUT-UIUX-01 §4).
   */
  eventsError: boolean;
  savedEvents: LocalEvent[];
  tribes: Tribe[];
  neighborhoods: Neighborhood[];
  culturalPlaces: CulturalPlaceListItem[];
  highlightOffer: PartnerOfferPublic | null;
  storyRings: StoryRingItem[];
  reload: () => void;
};

const DEFAULT_CITY = "Reims";

export function useFeedPortalContext(): FeedPortalContextState {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city ?? DEFAULT_CITY);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [eventsError, setEventsError] = useState(false);
  const [savedEvents, setSavedEvents] = useState<LocalEvent[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [culturalPlaces, setCulturalPlaces] = useState<CulturalPlaceListItem[]>([]);
  const [highlightOffer, setHighlightOffer] = useState<PartnerOfferPublic | null>(null);
  const [storyRings, setStoryRings] = useState<StoryRingItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setEventsError(false);
    try {
      const me = await api.getProfileMe();
      setProfile(me);
      const resolvedCity = me.city?.trim() || user?.city?.trim() || DEFAULT_CITY;
      setCity(resolvedCity);

      const requests: Promise<unknown>[] = [
        api.events.listEvents({ city: resolvedCity }),
        api.neighborhoods.listNeighborhoods({ city: resolvedCity, page_size: 8 }),
        api.listCulturalPlaces({ city: resolvedCity, featured: true, limit: 12 }),
        api.tribes.listTribes({ city: resolvedCity, page_size: 12 }),
        api.fetchPublicPartnerOffers({ city: resolvedCity, limit: 8 }),
        api.events.listSavedEvents(),
        api.listStoryRings(),
      ];

      const results = await Promise.allSettled(requests);
      const eventsRes = results[0];
      const hoodsRes = results[1];
      const cultureRes = results[2];
      const tribesRes = results[3];
      const offersRes = results[4];
      const savedRes = results[5];
      const ringsRes = results[6];

      if (eventsRes?.status === "fulfilled") {
        const value = eventsRes.value as Awaited<ReturnType<typeof api.events.listEvents>>;
        setEvents(filterAgendaUpcomingEvents(value.items));
      } else {
        setEvents([]);
        setEventsError(true);
      }

      if (hoodsRes?.status === "fulfilled") {
        const value = hoodsRes.value as Awaited<
          ReturnType<typeof api.neighborhoods.listNeighborhoods>
        >;
        setNeighborhoods(value.items.filter((h) => h.is_active));
      } else {
        setNeighborhoods([]);
      }

      if (cultureRes?.status === "fulfilled") {
        const value = cultureRes.value as Awaited<ReturnType<typeof api.listCulturalPlaces>>;
        setCulturalPlaces(value.items);
      } else {
        setCulturalPlaces([]);
      }

      if (tribesRes?.status === "fulfilled") {
        const value = tribesRes.value as Awaited<ReturnType<typeof api.tribes.listTribes>>;
        setTribes(value.items.filter((t) => !t.is_archived));
      } else {
        setTribes([]);
      }

      if (offersRes?.status === "fulfilled") {
        const value = offersRes.value as Awaited<ReturnType<typeof api.fetchPublicPartnerOffers>>;
        setHighlightOffer(value.items[0] ?? null);
      } else {
        setHighlightOffer(null);
      }

      if (savedRes?.status === "fulfilled") {
        const value = savedRes.value as Awaited<ReturnType<typeof api.events.listSavedEvents>>;
        setSavedEvents(filterAgendaUpcomingEvents(value.items));
      } else {
        setSavedEvents([]);
      }

      if (ringsRes?.status === "fulfilled") {
        const value = ringsRes.value as Awaited<ReturnType<typeof api.listStoryRings>>;
        setStoryRings(value.items);
      } else {
        setStoryRings([]);
      }
    } catch {
      setProfile(null);
      setEvents([]);
      setEventsError(true);
      setTribes([]);
      setStoryRings([]);
    } finally {
      setLoading(false);
    }
  }, [api, user?.city]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    city,
    loading,
    profile,
    events,
    eventsError,
    savedEvents: savedEvents.filter((e) => isEventWithinDays(e.starts_at, 30)),
    tribes,
    neighborhoods,
    culturalPlaces,
    highlightOffer,
    storyRings,
    reload: load,
  };
}
