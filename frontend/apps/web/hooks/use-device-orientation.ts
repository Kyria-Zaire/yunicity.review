"use client";

import { useSyncExternalStore } from "react";

export type DeviceOrientation = "portrait" | "landscape";

function getOrientation(): DeviceOrientation {
  if (typeof window === "undefined") return "portrait";
  return window.matchMedia("(orientation: landscape)").matches ? "landscape" : "portrait";
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const query = window.matchMedia("(orientation: landscape)");
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

/** Orientation physique de l'appareil (portrait / paysage). */
export function useDeviceOrientation(): DeviceOrientation {
  return useSyncExternalStore(subscribe, getOrientation, () => "portrait");
}
