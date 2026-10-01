"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_TEASER_FETCH_LIMIT,
  filterLocalVideoTeasers,
  type LocalVideoTeaserFilter,
} from "@yunicity/utils";
import { useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

type UseLocalVideoTeasersOptions = {
  city?: string;
  filter: LocalVideoTeaserFilter;
  latitude?: number;
  longitude?: number;
  enabled?: boolean;
};

export function useLocalVideoTeasers({
  city = "Reims",
  filter,
  latitude,
  longitude,
  enabled = true,
}: UseLocalVideoTeasersOptions) {
  const api = useYunicityApi();
  const [rawItems, setRawItems] = useState<LocalVideoFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [failed, setFailed] = useState(false);

  const filterKey = useMemo(() => JSON.stringify(filter), [filter]);

  useEffect(() => {
    if (!enabled) {
      setRawItems([]);
      setIsLoading(false);
      setFailed(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setFailed(false);

    void api
      .listLocalVideos({
        city,
        limit: LOCAL_VIDEO_TEASER_FETCH_LIMIT,
        latitude,
        longitude,
      })
      .then((response) => {
        if (cancelled) return;
        setRawItems(response.items);
      })
      .catch(() => {
        if (cancelled) return;
        setRawItems([]);
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api, city, enabled, filterKey, latitude, longitude]);

  const items = useMemo(() => {
    const parsed = JSON.parse(filterKey) as LocalVideoTeaserFilter;
    return filterLocalVideoTeasers(rawItems, parsed);
  }, [filterKey, rawItems]);

  return {
    items,
    isLoading,
    failed,
    isEmpty: !isLoading && items.length === 0,
  };
}
