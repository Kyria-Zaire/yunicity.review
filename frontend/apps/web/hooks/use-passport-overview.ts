"use client";

import type { PassportOverviewResponse } from "@yunicity/types";
import { useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

/**
 * D1.2-R3A — vue d'ensemble Passport, en UNE seule requete.
 *
 * `usePassportMe` appelle overview + badges + challenges + profil : bien trop
 * pour un module de rail dont le budget est d'exactement une requete. On
 * n'appelle donc que la route canonique `/me/passport`, via le client existant.
 */
export function usePassportOverview(): {
  overview: PassportOverviewResponse | null;
  loading: boolean;
  error: boolean;
} {
  const api = useYunicityApi();
  const [overview, setOverview] = useState<PassportOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(false);

    void api.passportMe
      .getMyPassport()
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        setOverview(res);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError(true);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [api]);

  return { overview, loading, error };
}
