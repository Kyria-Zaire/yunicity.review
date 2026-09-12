"use client";

import type { LocalVideoDurationPolicy } from "@yunicity/types";
import { LOCAL_VIDEO_MAX_DURATION_SECONDS } from "@yunicity/types";
import { useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

/**
 * Politique de durée du créateur connecté (VIDEO-04D).
 *
 * Le backend reste l'autorité : ce hook ne sert qu'au rejet anticipé et à
 * l'affichage. Toute indisponibilité (réseau, 401, politique absente) retombe
 * sur le palier pilote — jamais sur une limite plus permissive.
 */
export type LocalVideoDurationPolicyState = {
  policy: LocalVideoDurationPolicy | null;
  maxDurationSeconds: number;
  isLoading: boolean;
  isUnavailable: boolean;
};

/** Retombée sûre, identique au défaut serveur. */
export const PILOT_FALLBACK_SECONDS = LOCAL_VIDEO_MAX_DURATION_SECONDS;

export function useLocalVideoDurationPolicy(): LocalVideoDurationPolicyState {
  const api = useYunicityApi();
  const [policy, setPolicy] = useState<LocalVideoDurationPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await api.localVideos.getDurationPolicy();
        if (cancelled) return;
        setPolicy(result);
        setIsUnavailable(false);
      } catch {
        // Politique indisponible : on n'élargit jamais la limite, on retombe sur
        // le palier pilote et le backend tranchera de toute façon.
        if (cancelled) return;
        setPolicy(null);
        setIsUnavailable(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  return {
    policy,
    maxDurationSeconds: policy?.max_duration_seconds ?? PILOT_FALLBACK_SECONDS,
    isLoading,
    isUnavailable,
  };
}
