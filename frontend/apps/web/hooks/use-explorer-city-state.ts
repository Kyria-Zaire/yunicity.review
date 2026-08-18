"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  reduceSearchCityState,
  resolveSearchCityFromUrl,
  type SearchCityState,
} from "@/lib/explorer/search-city-state";
import { useAuth } from "@/lib/auth/auth-provider";

/** Résout l'état ville pour Explorer ou `/search` — aucun fallback produit codé en dur. */
export function useExplorerCityState(options?: {
  urlCity?: string | null;
  enabled?: boolean;
}): SearchCityState {
  const { isAuthenticated, yunicityApi, user } = useAuth();
  const enabled = options?.enabled ?? isAuthenticated;
  const urlCity = options?.urlCity;

  const [state, setState] = useState<SearchCityState>(() => {
    const fromUrl = resolveSearchCityFromUrl(urlCity ?? "");
    if (fromUrl) return fromUrl;
    return enabled ? { status: "loading" } : { status: "ready", city: "" };
  });

  const generationRef = useRef(0);

  const loadProfileCity = useCallback(async () => {
    if (!enabled) return;

    const fromUrl = resolveSearchCityFromUrl(urlCity ?? "");
    if (fromUrl) {
      setState(fromUrl);
      return;
    }

    const prefilled = resolveSearchCityFromUrl(user?.city ?? "");
    if (prefilled) {
      setState(prefilled);
      return;
    }

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    setState({ status: "loading" });

    try {
      const profile = await yunicityApi.getProfileMe();
      setState((current) =>
        reduceSearchCityState(
          current,
          { type: "profile-success", city: profile.city, generation },
          generation,
        ),
      );
    } catch {
      const retry = () => {
        void loadProfileCity();
      };
      setState((current) =>
        reduceSearchCityState(
          current,
          { type: "profile-error", retry, generation },
          generation,
        ),
      );
    }
  }, [enabled, urlCity, user?.city, yunicityApi]);

  useEffect(() => {
    void loadProfileCity();
  }, [loadProfileCity]);

  return state;
}
