"use client";

import type { LocalEvent, PartnerPublic, PassportStamp, Tribe } from "@yunicity/types";
import {
  buildPassportAchievements,
  buildPassportLevel,
  buildPassportProgression,
  buildPassportRecentBadges,
  countEarnedPassportBadges,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { usePassport } from "@/hooks/use-passport";
import { usePassportOffers } from "@/hooks/use-passport-offers";
import { usePassportStamps } from "@/hooks/use-passport-stamps";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

export type PassportDashboardNavId =
  | "overview"
  | "stats"
  | "badges"
  | "privileges"
  | "history"
  | "tips";

export function usePassportDashboardContext() {
  const api = useYunicityApi();
  const passportState = usePassport();
  const hasPassport = passportState.passport !== null;
  const { stamps, isLoading: stampsLoading } = usePassportStamps(hasPassport);
  const offersState = usePassportOffers(hasPassport);

  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [savedEvents, setSavedEvents] = useState<LocalEvent[]>([]);
  const [featuredPartners, setFeaturedPartners] = useState<PartnerPublic[]>([]);
  const [contextLoading, setContextLoading] = useState(false);

  const loadContext = useCallback(async () => {
    if (!hasPassport || !passportState.passport) {
      setTribes([]);
      setSavedEvents([]);
      setFeaturedPartners([]);
      return;
    }
    const city = passportState.passport.city.trim() || "Reims";
    setContextLoading(true);
    try {
      const [tribesRes, savedRes, partnersRes] = await Promise.allSettled([
        api.tribes.listTribes({ city, page_size: 40 }),
        api.events.listSavedEvents(),
        api.listPartners({ city, featured: true, limit: 8 }),
      ]);
      setTribes(tribesRes.status === "fulfilled" ? tribesRes.value.items : []);
      setSavedEvents(savedRes.status === "fulfilled" ? savedRes.value.items : []);
      if (partnersRes.status === "fulfilled") {
        setFeaturedPartners(partnersRes.value.items);
      } else {
        try {
          const fallback = await api.listPartners({ city, limit: 8 });
          setFeaturedPartners(fallback.items);
        } catch {
          setFeaturedPartners([]);
        }
      }
    } finally {
      setContextLoading(false);
    }
  }, [api, hasPassport, passportState.passport]);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  const achievementInput = useMemo(() => {
    if (!passportState.passport) return null;
    return {
      passport: passportState.passport,
      stamps,
      tribes,
      savedEvents,
      postsCount: null as number | null,
    };
  }, [passportState.passport, stamps, tribes, savedEvents]);

  const levelView = useMemo(
    () => (passportState.passport ? buildPassportLevel(passportState.passport) : null),
    [passportState.passport],
  );

  const achievements = useMemo(
    () => (achievementInput ? buildPassportAchievements(achievementInput) : []),
    [achievementInput],
  );

  const progression = useMemo(
    () => (passportState.passport ? buildPassportProgression(passportState.passport) : []),
    [passportState.passport],
  );

  const badges = useMemo(
    () => (achievementInput ? buildPassportRecentBadges(achievementInput) : []),
    [achievementInput],
  );

  const earnedBadgesCount = useMemo(() => countEarnedPassportBadges(badges), [badges]);

  const isLoading =
    passportState.isLoading || (hasPassport && (contextLoading || stampsLoading || offersState.isLoading));

  return {
    ...passportState,
    hasPassport,
    stamps,
    tribes,
    savedEvents,
    levelView,
    achievements,
    progression,
    badges,
    earnedBadgesCount,
    offers: offersState.offers,
    featuredPartners,
    offersLoading: offersState.isLoading,
    stampsLoading,
    redeem: offersState.redeem,
    redeemingId: offersState.redeemingId,
    offerMessage: offersState.message,
    isLoading,
    reloadAll: async () => {
      await passportState.reload();
      await loadContext();
    },
  };
}
