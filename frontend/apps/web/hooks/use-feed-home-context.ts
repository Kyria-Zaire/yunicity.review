"use client";

import type { LocalEvent, Neighborhood, PartnerOfferPublic, PassportMe, Tribe } from "@yunicity/types";
import { isEventWithinDays } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

export type FeedHomeContextState = {
  city: string;
  loading: boolean;
  weekEvents: LocalEvent[];
  neighborhoods: Neighborhood[];
  highlightOffer: PartnerOfferPublic | null;
  passport: PassportMe | null;
  featuredTribe: Tribe | null;
};

const DEFAULT_CITY = "Reims";

export function useFeedHomeContext(): FeedHomeContextState {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city ?? DEFAULT_CITY);
  const [loading, setLoading] = useState(true);
  const [weekEvents, setWeekEvents] = useState<LocalEvent[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [highlightOffer, setHighlightOffer] = useState<PartnerOfferPublic | null>(null);
  const [passport, setPassport] = useState<PassportMe | null>(null);
  const [featuredTribe, setFeaturedTribe] = useState<Tribe | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await api.getProfileMe();
      const resolvedCity = profile.city?.trim() || user?.city?.trim() || DEFAULT_CITY;
      setCity(resolvedCity);

      const [eventsRes, hoodsRes, offersRes, passportRes, tribesRes] = await Promise.allSettled([
        api.events.listEvents({ city: resolvedCity }),
        api.neighborhoods.listNeighborhoods({ city: resolvedCity, page_size: 6 }),
        api.listPassportOffers(),
        api.getPassportMe(),
        api.tribes.listTribes({ city: resolvedCity, page_size: 1, featured_only: true }),
      ]);

      if (eventsRes.status === "fulfilled") {
        const upcoming = eventsRes.value.items
          .filter((e) => isEventWithinDays(e.starts_at, 7))
          .slice(0, 5);
        setWeekEvents(upcoming);
      } else {
        setWeekEvents([]);
      }

      if (hoodsRes.status === "fulfilled") {
        setNeighborhoods(hoodsRes.value.items.slice(0, 4));
      } else {
        setNeighborhoods([]);
      }

      if (offersRes.status === "fulfilled" && offersRes.value.items.length > 0) {
        setHighlightOffer(offersRes.value.items[0] ?? null);
      } else {
        setHighlightOffer(null);
      }

      if (passportRes.status === "fulfilled") {
        setPassport(passportRes.value);
      } else {
        setPassport(null);
      }

      if (tribesRes.status === "fulfilled" && tribesRes.value.items.length > 0) {
        setFeaturedTribe(tribesRes.value.items[0] ?? null);
      } else {
        const fallback = await api.tribes.listTribes({ city: resolvedCity, page_size: 1 }).catch(() => null);
        setFeaturedTribe(fallback?.items[0] ?? null);
      }
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
    weekEvents,
    neighborhoods,
    highlightOffer,
    passport,
    featuredTribe,
  };
}
