"use client";

import type { NeighborhoodDetail } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export type NeighborhoodDetailV2State = {
  loading: boolean;
  error: boolean;
  isNotFound: boolean;
  detail: NeighborhoodDetail | null;
  reload: () => void;
};

export function useNeighborhoodDetailV2(slug: string, city: string): NeighborhoodDetailV2State {
  const api = useYunicityApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const [detail, setDetail] = useState<NeighborhoodDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    setIsNotFound(false);
    try {
      const response = await api.neighborhoods.getNeighborhood(slug, city);
      setDetail(response);
    } catch (err) {
      setDetail(null);
      if (isAuthError(err) && err.status === 404) {
        setIsNotFound(true);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [api.neighborhoods, city, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    loading,
    error,
    isNotFound,
    detail,
    reload: () => void load(),
  };
}
