"use client";

import type { MapBbox } from "@yunicity/types";
import { boundsToMapBbox } from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

export type MapBoundsLike = {
  getNorth: () => number;
  getSouth: () => number;
  getEast: () => number;
  getWest: () => number;
};

export function useMapBbox() {
  const [bbox, setBbox] = useState<MapBbox | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateFromBounds = useCallback((bounds: MapBoundsLike) => {
    const next = boundsToMapBbox(bounds);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setBbox(next);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { bbox, updateFromBounds };
}
