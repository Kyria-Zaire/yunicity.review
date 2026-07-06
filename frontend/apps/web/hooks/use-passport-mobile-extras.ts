"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { PassportMe } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

/** Données legacy `/passport/me` + QR pour la carte mobile (MOBILE-PASSPORT-01). */
export function usePassportMobileExtras(enabled: boolean) {
  const { yunicityApi } = useAuth();
  const [passportMe, setPassportMe] = useState<PassportMe | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setPassportMe(null);
      setQrPayload(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const profile = await yunicityApi.getProfileMe();
      if (!profile.has_active_passport) {
        setPassportMe(null);
        setQrPayload(null);
        return;
      }

      const [legacyPassport, qrData] = await Promise.all([
        yunicityApi.tryGetPassportMe(),
        yunicityApi.getPassportQr(),
      ]);
      setPassportMe(legacyPassport);
      setQrPayload(qrData.qr_payload);
    } catch (err) {
      setPassportMe(null);
      setQrPayload(null);
      setError(isAuthError(err) ? err.message : "Impossible de charger le QR Passport.");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, yunicityApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { passportMe, qrPayload, isLoading, error, reload };
}
