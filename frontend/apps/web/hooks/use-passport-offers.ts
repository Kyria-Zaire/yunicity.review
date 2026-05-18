"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { PartnerOffer } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function usePassportOffers(enabled: boolean) {
  const { yunicityApi } = useAuth();
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await yunicityApi.listPassportOffers();
      setOffers(data.items);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger les offres.");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, yunicityApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const redeem = useCallback(
    async (offerId: string) => {
      setRedeemingId(offerId);
      setMessage(null);
      try {
        await yunicityApi.redeemPassportOffer(offerId);
        setMessage("Offre utilisée.");
      } catch (err) {
        setMessage(isAuthError(err) ? err.message : "Échec.");
      } finally {
        setRedeemingId(null);
      }
    },
    [yunicityApi],
  );

  return { offers, error, isLoading, redeem, redeemingId, message };
}
