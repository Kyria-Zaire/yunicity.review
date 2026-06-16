"use client";

import { useEffect, useState } from "react";

/**
 * FEATURE-MAP-GOOGLE-01 — Chargeur Google Maps JS API côté client.
 *
 * - Aucun secret backend : seule la clé publique `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
 *   (restreinte par referrer dans Google Cloud) est utilisée.
 * - Le script n'est injecté qu'une seule fois (singleton de promesse).
 * - On utilise le `callback` officiel Google : il n'est invoqué qu'une fois
 *   l'API ENTIÈREMENT chargée, avec `google.maps.Map`/`Marker` disponibles.
 *   (Le mode `loading=async` ne garantit pas que les classes soient montées au
 *   `onload` du script, ce qui provoquait « google.maps.Map is not a
 *   constructor » ou un échec de `importLibrary`.)
 */

export type GoogleMapsStatus = "idle" | "loading" | "ready" | "error";

const SCRIPT_ID = "yunicity-google-maps-js";
const CALLBACK_NAME = "__yunicityGoogleMapsReady";
let loadPromise: Promise<void> | null = null;

function isGoogleMapsReady(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof google !== "undefined" &&
    typeof google.maps !== "undefined" &&
    typeof google.maps.Map === "function"
  );
}

function waitForReady(timeoutMs = 15_000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (isGoogleMapsReady()) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("google-maps: délai dépassé"));
        return;
      }
      window.setTimeout(tick, 100);
    };
    tick();
  });
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("google-maps: window indisponible (SSR)"));
  }
  if (isGoogleMapsReady()) {
    return Promise.resolve();
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    // Le script a déjà été injecté (ex. remount/HMR) : on attend que l'API soit prête.
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      waitForReady().then(resolve).catch(reject);
      return;
    }

    // Callback global déclenché par Google une fois l'API totalement chargée.
    (window as unknown as Record<string, () => void>)[CALLBACK_NAME] = () => resolve();

    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      language: "fr",
      region: "FR",
      callback: CALLBACK_NAME,
    });

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("google-maps: échec de chargement du script"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useGoogleMaps(apiKey: string): GoogleMapsStatus {
  const [status, setStatus] = useState<GoogleMapsStatus>(() =>
    isGoogleMapsReady() ? "ready" : "idle",
  );

  useEffect(() => {
    if (!apiKey) {
      setStatus("error");
      return;
    }
    if (isGoogleMapsReady()) {
      setStatus("ready");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    loadGoogleMaps(apiKey)
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          // Permet une nouvelle tentative si le composant est remonté.
          loadPromise = null;
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return status;
}
