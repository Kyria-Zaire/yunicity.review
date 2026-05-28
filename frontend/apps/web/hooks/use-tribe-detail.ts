"use client";

import type { Tribe, TribeMember } from "@yunicity/types";
import type { CulturalPlaceListItem, LocalEvent, Neighborhood, PartnerOffer, PassportMe } from "@yunicity/types";
import { TRIBE_NOT_FOUND, filterAgendaUpcomingEvents, isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function useTribeDetail(slug: string, city: string) {
  const api = useYunicityApi();
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [places, setPlaces] = useState<CulturalPlaceListItem[]>([]);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [passport, setPassport] = useState<PassportMe | null>(null);
  const [members, setMembers] = useState<TribeMember[]>([]);
  const [relatedTribes, setRelatedTribes] = useState<Tribe[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tribeData = await api.tribes.getTribe(slug, city);
      setTribe(tribeData);
      const [eventsRes, hoodsRes, placesRes, offersRes, passportRes, membersRes, tribesRes] =
        await Promise.allSettled([
          api.events.listEvents({ city }),
          api.neighborhoods.listNeighborhoods({ city, page_size: 20 }),
          api.listCulturalPlaces({ city, limit: 20 }),
          api.listPassportOffers(),
          api.getPassportMe(),
          api.tribes.listTribeMembers(slug, city, { page_size: 12 }),
          api.tribes.listTribes({ city, page_size: 8 }),
        ]);

      setEvents(
        eventsRes.status === "fulfilled" ? filterAgendaUpcomingEvents(eventsRes.value.items) : [],
      );
      setNeighborhoods(
        hoodsRes.status === "fulfilled"
          ? hoodsRes.value.items.filter((hood) => hood.is_active)
          : [],
      );
      setPlaces(placesRes.status === "fulfilled" ? placesRes.value.items : []);
      setOffers(offersRes.status === "fulfilled" ? offersRes.value.items.slice(0, 3) : []);
      setPassport(passportRes.status === "fulfilled" ? passportRes.value : null);
      setMembers(membersRes.status === "fulfilled" ? membersRes.value.items : []);
      setRelatedTribes(
        tribesRes.status === "fulfilled"
          ? tribesRes.value.items.filter((item) => item.slug !== slug && !item.is_archived).slice(0, 3)
          : [],
      );
    } catch (err) {
      if (!isAuthError(err)) {
        setError(TRIBE_NOT_FOUND);
      }
    } finally {
      setLoading(false);
    }
  }, [api.tribes, slug, city]);

  useEffect(() => {
    void load();
  }, [load]);

  const join = useCallback(
    async (charterAccepted: boolean): Promise<TribeMember | null> => {
      if (!charterAccepted) {
        setActionError("Acceptez la charte pour rejoindre.");
        return null;
      }
      setJoining(true);
      setActionError(null);
      try {
        await api.tribes.joinTribe(slug, city, { charter_accepted: true });
        await load();
        return null;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Impossible de rejoindre pour le moment.";
        setActionError(message);
        return null;
      } finally {
        setJoining(false);
      }
    },
    [api.tribes, slug, city, load],
  );

  const leave = useCallback(async () => {
    setLeaving(true);
    setActionError(null);
    try {
      await api.tribes.leaveTribe(slug, city);
      await load();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible de quitter pour le moment.";
      setActionError(message);
    } finally {
      setLeaving(false);
    }
  }, [api.tribes, slug, city, load]);

  return {
    tribe,
    loading,
    error,
    events,
    neighborhoods,
    places,
    offers,
    passport,
    members,
    relatedTribes,
    actionError,
    joining,
    leaving,
    reload: load,
    join,
    leave,
  };
}
