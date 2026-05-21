import type { MapBbox } from "@yunicity/types";
import { useCallback, useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

export function useMapBbox() {
  const [bbox, setBbox] = useState<MapBbox | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateFromBounds = useCallback((next: MapBbox) => {
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
