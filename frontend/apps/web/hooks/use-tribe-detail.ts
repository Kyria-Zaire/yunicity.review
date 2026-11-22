"use client";

import type { Tribe, TribeMember } from "@yunicity/types";
import type { CulturalPlaceListItem, FeedPost, LocalEvent, Neighborhood, PartnerOfferPublic } from "@yunicity/types";
import { TRIBE_NOT_FOUND, filterAgendaUpcomingEvents, isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

export function useTribeDetail(slug: string, city: string) {
  const api = useYunicityApi();
  // La fiche dépend du lecteur (membre, demande en attente). Au rechargement, la session
  // n'est restaurée qu'à la fin de l'amorçage : charger plus tôt enverrait une requête
  // anonyme. On attend donc l'amorçage, puis on recharge à chaque changement d'identité.
  const { user, isLoading: authLoading } = useAuth();
  const viewerId = user?.id ?? null;
  // Seul le dernier chargement lancé écrit l'état : une réponse plus ancienne (lecteur
  // précédent, rechargement dépassé) est ignorée.
  const latestLoadRef = useRef(0);
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [places, setPlaces] = useState<CulturalPlaceListItem[]>([]);
  const [offers, setOffers] = useState<PartnerOfferPublic[]>([]);
  const [members, setMembers] = useState<TribeMember[]>([]);
  const [relatedTribes, setRelatedTribes] = useState<Tribe[]>([]);
  const [memberTribes, setMemberTribes] = useState<Tribe[]>([]);
  const [postsPreview, setPostsPreview] = useState<FeedPost[]>([]);
  const [membersTotal, setMembersTotal] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(async () => {
    const loadId = latestLoadRef.current + 1;
    latestLoadRef.current = loadId;
    const isLatest = () => latestLoadRef.current === loadId;
    setLoading(true);
    setError(null);
    try {
      const tribeData = await api.tribes.getTribe(slug, city);
      if (!isLatest()) return;
      setTribe(tribeData);
      const [eventsRes, hoodsRes, placesRes, offersRes, membersRes, tribesRes] =
        await Promise.allSettled([
          api.events.listEvents({ city }),
          api.neighborhoods.listNeighborhoods({ city, page_size: 20 }),
          api.listCulturalPlaces({ city, limit: 20 }),
          api.fetchPublicPartnerOffers({ city, limit: 8 }),
          api.tribes.listTribeMembers(slug, city, { page_size: 12 }),
          api.tribes.listTribes({ city, page_size: 8 }),
        ]);
      if (!isLatest()) return;

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
      setMembers(membersRes.status === "fulfilled" ? membersRes.value.items : []);
      setMembersTotal(membersRes.status === "fulfilled" ? membersRes.value.total : 0);
      const allTribes =
        tribesRes.status === "fulfilled"
          ? tribesRes.value.items.filter((item) => !item.is_archived)
          : [];
      setRelatedTribes(allTribes.filter((item) => item.slug !== slug).slice(0, 3));
      setMemberTribes(allTribes.filter((item) => item.viewer_is_member));

      if (tribeData.viewer_is_member && !tribeData.is_archived) {
        try {
          const postsRes = await api.tribes.listTribePosts(slug, city, { limit: 4 });
          if (isLatest()) setPostsPreview(postsRes.items);
        } catch {
          if (isLatest()) setPostsPreview([]);
        }
      } else {
        setPostsPreview([]);
      }
    } catch (err) {
      if (isLatest() && !isAuthError(err)) {
        setError(TRIBE_NOT_FOUND);
      }
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [api.tribes, slug, city]);

  // `viewerId` relance le chargement quand l'identité change (connexion, déconnexion, A → B).
  // Le nettoyage invalide toute réponse en vol AVANT l'effet suivant : changement
  // d'identité, retour en amorçage (aucun nouvel appel) et démontage.
  useEffect(() => {
    if (!authLoading) void load();
    return () => {
      latestLoadRef.current += 1;
    };
  }, [authLoading, load, viewerId]);

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
    members,
    membersTotal,
    memberTribes,
    postsPreview,
    relatedTribes,
    actionError,
    joining,
    leaving,
    reload: load,
    join,
    leave,
  };
}
