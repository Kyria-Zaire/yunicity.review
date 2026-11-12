"use client";

import {
  formatEventCountdownLabel,
  nextEventCountdownLabelChangeMs,
  resolveEventTimeStatus,
  type EventTimeStatus,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

/** Statut temporel et vignette de la fiche, calculés au même instant (EVENTS-PAST-01). */
export type EventDetailTiming = {
  status: EventTimeStatus;
  countdownLabel: string | null;
};

/** Au-delà, `setTimeout` déborde (2^31 − 1 ms) : on revérifie au plus tard chaque jour. */
const MAX_TIMER_DELAY_MS = 24 * 60 * 60 * 1000;

/**
 * Tient statut et vignette à jour tant que la fiche reste ouverte :
 * - avant le début, le compte à rebours est rafraîchi à chaque changement de minute ;
 * - ensuite, un minuteur vise le prochain franchissement (début, puis fin effective) ;
 * - le délai est borné à 24 h (événements lointains) ;
 * - au retour sur l'onglet (`visibilitychange`, `resume`, `pageshow`, `focus`), tout est recalculé
 *   avec l'heure courante : un minuteur gelé ou retardé en arrière-plan ne laisse pas
 *   un statut périmé.
 */
export function useEventDetailTiming(startsAt: string | null, endsAt: string | null): EventDetailTiming {
  const key = `${startsAt ?? ""}|${endsAt ?? ""}`;
  const [clock, setClock] = useState(() => ({ key, nowMs: Date.now() }));
  if (clock.key !== key) {
    // Nouvel événement chargé : l'instant de référence est rafraîchi pendant le rendu.
    setClock({ key, nowMs: Date.now() });
  }
  const nowMs = clock.key === key ? clock.nowMs : Date.now();

  const refresh = useCallback(() => setClock({ key, nowMs: Date.now() }), [key]);

  useEffect(() => {
    if (!startsAt) return undefined;
    const next = nextEventCountdownLabelChangeMs(startsAt, endsAt, new Date(nowMs));
    if (next === null) return undefined;
    const delay = Math.min(Math.max(next - Date.now(), 0), MAX_TIMER_DELAY_MS);
    const timer = window.setTimeout(refresh, delay);
    return () => window.clearTimeout(timer);
  }, [endsAt, nowMs, refresh, startsAt]);

  useEffect(() => {
    if (!startsAt) return undefined;
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    // `resume` : sortie de gel d'une page (Page Lifecycle API, Chromium).
    document.addEventListener("resume", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("resume", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh, startsAt]);

  return useMemo(() => {
    if (!startsAt) return { status: "unknown", countdownLabel: null };
    const now = new Date(nowMs);
    return {
      status: resolveEventTimeStatus(startsAt, endsAt, now),
      countdownLabel: formatEventCountdownLabel(startsAt, endsAt, now),
    };
  }, [endsAt, nowMs, startsAt]);
}
