"use client";

import { usePassportMe } from "@/hooks/use-passport-me";
import { usePassportMobileExtras } from "@/hooks/use-passport-mobile-extras";
import { usePassportOffers } from "@/hooks/use-passport-offers";
import { useAuth } from "@/lib/auth/auth-provider";
import type { PartnerOfferPublic } from "@yunicity/types";
import { buildSettingsDisplayName } from "@yunicity/utils";
import { useEffect, useMemo, useRef, useState } from "react";

export function usePassportOfferDetail(offerId: string) {
  const { user, yunicityApi } = useAuth();
  const passport = usePassportMe();
  const passportActive =
    !passport.needsActivation &&
    !passport.isSessionExpired &&
    !!passport.overview &&
    !!passport.badges &&
    !!passport.challenges;
  const extras = usePassportMobileExtras(passportActive, !!passport.profile?.has_active_passport);
  const offersState = usePassportOffers(passportActive);
  const [fallbackOffer, setFallbackOffer] = useState<PartnerOfferPublic | null>(null);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const fallbackTriedRef = useRef(false);

  const city = passport.profile?.city?.trim() || "Reims";

  const offerFromList = useMemo(
    () => offersState.offers.find((item) => item.id === offerId) ?? null,
    [offerId, offersState.offers],
  );

  useEffect(() => {
    if (!passportActive || offersState.isLoading || offerFromList || fallbackTriedRef.current) {
      return;
    }
    fallbackTriedRef.current = true;
    setFallbackLoading(true);
    void yunicityApi
      .fetchPublicPartnerOffers({ city, limit: 100 })
      .then((data) => {
        setFallbackOffer(data.items.find((item) => item.id === offerId) ?? null);
      })
      .catch(() => {
        setFallbackOffer(null);
      })
      .finally(() => {
        setFallbackLoading(false);
      });
  }, [city, offerFromList, offerId, offersState.isLoading, passportActive, yunicityApi]);

  const related = useMemo(
    () => offersState.offers.filter((item) => item.id !== offerId).slice(0, 3),
    [offerId, offersState.offers],
  );

  return {
    ...passport,
    extras,
    offersLoading: offersState.isLoading || fallbackLoading,
    offer: offerFromList ?? fallbackOffer,
    related,
    city,
    displayName: passport.profile
      ? buildSettingsDisplayName(passport.profile, user)
      : user?.full_name?.trim() || "Citoyen",
  };
}
