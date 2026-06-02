import { useAuth } from "@/lib/auth-provider";
import type { PartnerOfferPublic } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function usePassportOffers(enabled: boolean) {
  const { yunicityApi } = useAuth();
  const [offers, setOffers] = useState<PartnerOfferPublic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [redeemedIds, setRedeemedIds] = useState<Set<string>>(() => new Set());

  const reload = useCallback(async () => {
    if (!enabled) {
      setOffers([]);
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
      setFeedback(null);
      try {
        await yunicityApi.redeemPassportOffer(offerId);
        setRedeemedIds((prev) => new Set(prev).add(offerId));
        setFeedback({ type: "success", message: "Offre utilisée — profite bien !" });
      } catch (err) {
        if (isAuthError(err)) {
          if (err.code === "REDEMPTION_ALREADY_EXISTS") {
            setRedeemedIds((prev) => new Set(prev).add(offerId));
            setFeedback({ type: "error", message: "Tu as déjà utilisé cette offre." });
          } else {
            setFeedback({ type: "error", message: err.message });
          }
        } else {
          setFeedback({ type: "error", message: "Échec de l'utilisation." });
        }
      } finally {
        setRedeemingId(null);
      }
    },
    [yunicityApi],
  );

  return {
    offers,
    error,
    isLoading,
    reload,
    redeem,
    redeemingId,
    feedback,
    redeemedIds,
    clearFeedback: () => setFeedback(null),
  };
}
