"use client";

import type {
  CulturalPlaceListItem,
  FeedPost,
  LocalEvent,
  Neighborhood,
  PassportMe,
  PassportStamp,
  ProfileMe,
  Tribe,
} from "@yunicity/types";
import {
  buildPassportLevel,
  buildProfileActivityTimeline,
  buildProfileBadgesPreview,
  buildProfileHeroSubtitle,
  buildProfileJourneyCtas,
  buildProfileLocalJourneyItems,
  buildProfileNeighborhoodCards,
  buildProfilePortalBadgeItems,
  buildProfilePortalImpactPercent,
  buildProfilePortalStats,
  buildProfileTribeCards,
  formatProfileImpactLabel,
  resolveProfilePortalLevelTitle,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function useProfilePortalContext() {
  const api = useYunicityApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [passport, setPassport] = useState<PassportMe | null>(null);
  const [stamps, setStamps] = useState<PassportStamp[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<LocalEvent[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [culturalPlaces, setCulturalPlaces] = useState<CulturalPlaceListItem[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const profileData = await api.getProfileMe();
      setProfile(profileData);
      const city = profileData.city?.trim() || "Reims";

      const [
        passportRes,
        stampsRes,
        tribesRes,
        eventsRes,
        savedRes,
        hoodsRes,
        placesRes,
        feedRes,
      ] = await Promise.allSettled([
        api.getPassportMe(),
        api.listPassportStamps(),
        api.tribes.listTribes({ city, page_size: 40 }),
        api.events.listEvents({ city }),
        api.events.listSavedEvents(),
        api.neighborhoods.listNeighborhoods({ city, page_size: 20 }),
        api.listCulturalPlaces({ city, limit: 24 }),
        api.listFeed({ limit: 40 }),
      ]);

      setPassport(passportRes.status === "fulfilled" ? passportRes.value : null);
      setStamps(stampsRes.status === "fulfilled" ? stampsRes.value.items : []);
      setTribes(
        tribesRes.status === "fulfilled"
          ? tribesRes.value.items.filter((tribe) => !tribe.is_archived)
          : [],
      );
      setEvents(eventsRes.status === "fulfilled" ? eventsRes.value.items : []);
      setSavedEvents(savedRes.status === "fulfilled" ? savedRes.value.items : []);
      setNeighborhoods(
        hoodsRes.status === "fulfilled"
          ? hoodsRes.value.items.filter((hood) => hood.is_active)
          : [],
      );
      setCulturalPlaces(placesRes.status === "fulfilled" ? placesRes.value.items : []);
      setFeedPosts(feedRes.status === "fulfilled" ? feedRes.value.items : []);
    } catch {
      setError(true);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  const city = profile?.city?.trim() || "Reims";

  const levelView = useMemo(
    () => (passport ? buildPassportLevel(passport) : null),
    [passport],
  );

  const stats = useMemo(
    () =>
      profile
        ? buildProfilePortalStats({
            profile,
            passport,
            stamps,
            tribes,
            savedEvents,
            feedPosts,
          })
        : [],
    [feedPosts, passport, profile, savedEvents, stamps, tribes],
  );

  const activityTimeline = useMemo(
    () =>
      profile
        ? buildProfileActivityTimeline({
            profile,
            passport,
            feedPosts,
            stamps,
            tribes,
            savedEvents,
            culturalPlaces,
            neighborhoods,
          })
        : [],
    [culturalPlaces, feedPosts, neighborhoods, passport, profile, savedEvents, stamps, tribes],
  );

  const localLandmarks = useMemo(
    () =>
      profile
        ? buildProfileLocalJourneyItems({
            city,
            tribes,
            savedEvents,
            culturalPlaces,
            stamps,
            passport,
            feedPosts,
            profile,
          })
        : [],
    [city, culturalPlaces, feedPosts, passport, profile, savedEvents, stamps, tribes],
  );

  const journeyCtas = useMemo(() => buildProfileJourneyCtas(city), [city]);

  const neighborhoodCards = useMemo(
    () =>
      buildProfileNeighborhoodCards({
        city,
        stamps,
        neighborhoods,
      }),
    [city, neighborhoods, stamps],
  );

  const tribeCards = useMemo(
    () =>
      buildProfileTribeCards({
        city,
        tribes,
        events,
      }),
    [city, events, tribes],
  );

  const levelTitle = useMemo(() => resolveProfilePortalLevelTitle(levelView), [levelView]);
  const impactPercent = useMemo(() => buildProfilePortalImpactPercent(levelView), [levelView]);

  const badges = useMemo(
    () =>
      profile && passport
        ? buildProfilePortalBadgeItems({
            profile,
            passport,
            stamps,
            tribes,
            savedEvents,
            feedPosts,
          })
        : [],
    [feedPosts, passport, profile, savedEvents, stamps, tribes],
  );

  const badgesPreview = useMemo(
    () =>
      profile
        ? buildProfileBadgesPreview({
            profile,
            passport,
            stamps,
            tribes,
            savedEvents,
            feedPosts,
          })
        : { badges: [], emptyCopy: "" },
    [feedPosts, passport, profile, savedEvents, stamps, tribes],
  );

  const heroSubtitle = useMemo(
    () =>
      buildProfileHeroSubtitle({
        city,
        tribes,
        stampsCount: stamps.length,
        levelTitle,
      }),
    [city, levelTitle, stamps.length, tribes],
  );

  const impactLabel = useMemo(
    () => formatProfileImpactLabel(impactPercent, levelView),
    [impactPercent, levelView],
  );

  return {
    loading,
    error,
    profile,
    passport,
    city,
    levelView,
    levelTitle,
    impactPercent,
    impactLabel,
    heroSubtitle,
    stats,
    activityTimeline,
    localLandmarks,
    journeyCtas,
    neighborhoodCards,
    tribeCards,
    badges,
    badgesPreview,
    reload: load,
    setProfile,
  };
}
