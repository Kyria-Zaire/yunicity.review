"use client";

import { useEffect, useState } from "react";

/**
 * FEATURE-MAP-GOOGLE-01 — Chargeur Google Maps JS API côté client.
 *
 * - Aucun secret backend : seule la clé publique `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
 *   (restreinte par referrer dans Google Cloud) est utilisée.
 * - Le script n'est injecté qu'une seule fois (singleton de promesse), même si
 *   plusieurs composants montent le hook.
 * - `loading=async` ne garantit PAS que `google.maps.Map` soit disponible au
 *   `onload` du script : il faut attendre `importLibrary(...)` avant de signaler
 *   `ready`, sinon `new google.maps.Map(...)` lève « is not a constructor ».
 */

export type GoogleMapsStatus = "idle" | "loading" | "ready" | "error";

const SCRIPT_ID = "yunicity-google-maps-js";
let loadPromise: Promise<void> | null = null;

function isGoogleMapsReady(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof google !== "undefined" &&
    typeof google.maps !== "undefined" &&
    typeof google.maps.Map === "function"
  );
}

async function importMapsLibraries(): Promise<void> {
  // Garantit que les classes (Map, Marker, Point, SymbolPath) sont montées.
  await google.maps.importLibrary("maps");
  await google.maps.importLibrary("marker");
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
    const finalize = () => {
      importMapsLibraries().then(resolve).catch(reject);
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      // Le script peut déjà avoir été chargé : on tente directement l'import,
      // sinon on attend son évènement load.
      if (typeof google !== "undefined" && typeof google.maps?.importLibrary === "function") {
        finalize();
      } else {
        existing.addEventListener("load", finalize);
        existing.addEventListener("error", () =>
          reject(new Error("google-maps: échec de chargement du script existant")),
        );
      }
      return;
    }

    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      loading: "async",
      language: "fr",
      region: "FR",
    });

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onload = finalize;
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
