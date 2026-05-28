"use client";

import type { CulturalPlaceListItem, CulturalPlaceSort, CulturalPlaceStatsResponse } from "@yunicity/types";
import type { PlacesCategoryFilterId } from "@yunicity/utils";
import {
  PLACES_PAGE_SIZE,
  filterPlacesByCategoryGroup,
  filterPlacesBySearch,
  pickFeaturedPlaces,
  pickRecentPlaces,
  selectPlacesNewBadgeIds,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";
const CATALOG_LIMIT = 100;

export function usePlacesPortalContext(cityParam: string) {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [city, setCity] = useState(cityParam.trim() || user?.city?.trim() || DEFAULT_CITY);
  const [stats, setStats] = useState<CulturalPlaceStatsResponse | null>(null);
  const [catalog, setCatalog] = useState<CulturalPlaceListItem[]>([]);
  const [featured, setFeatured] = useState<CulturalPlaceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PlacesCategoryFilterId>("all");
  const [sort, setSort] = useState<CulturalPlaceSort>("featured");
  const [visibleCount, setVisibleCount] = useState(PLACES_PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let resolvedCity = cityParam.trim() || user?.city?.trim() || DEFAULT_CITY;
      try {
        const profile = await api.getProfileMe();
        resolvedCity = profile.city?.trim() || resolvedCity;
      } catch {
        /* profil optionnel */
      }
      setCity(resolvedCity);

      const [statsRes, featuredRes, catalogRes] = await Promise.all([
        api.getCulturalPlacesStats(resolvedCity),
        api.listCulturalPlaces({
          city: resolvedCity,
          featured: true,
          limit: 12,
          sort: "featured",
        }),
        api.listCulturalPlaces({
          city: resolvedCity,
          limit: CATALOG_LIMIT,
          sort: "featured",
        }),
      ]);

      setStats(statsRes);
      setFeatured(
        featuredRes.items.length > 0 ? featuredRes.items : pickFeaturedPlaces(catalogRes.items, 8),
      );
      setCatalog(catalogRes.items);
      setVisibleCount(PLACES_PAGE_SIZE);
    } catch {
      setStats(null);
      setCatalog([]);
      setFeatured([]);
      setError("load_failed");
    } finally {
      setLoading(false);
    }
  }, [api, cityParam, user?.city]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredPlaces = useMemo(() => {
    const byCategory = filterPlacesByCategoryGroup(catalog, categoryFilter);
    return filterPlacesBySearch(byCategory, searchQuery);
  }, [catalog, categoryFilter, searchQuery]);

  const recentPlaces = useMemo(
    () => pickRecentPlaces(filteredPlaces, visibleCount),
    [filteredPlaces, visibleCount],
  );

  useEffect(() => {
    setVisibleCount(PLACES_PAGE_SIZE);
  }, [categoryFilter, searchQuery]);

  const hasMore = visibleCount < filteredPlaces.length;

  const newBadgeIds = useMemo(
    () => selectPlacesNewBadgeIds(filteredPlaces),
    [filteredPlaces],
  );

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PLACES_PAGE_SIZE, filteredPlaces.length));
  }, [filteredPlaces.length]);

  return {
    city,
    stats,
    featured,
    recentPlaces,
    newBadgeIds,
    totalFiltered: filteredPlaces.length,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    sort,
    setSort,
    hasMore,
    loadMore,
    reload: load,
  };
}
