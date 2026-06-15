"use client";

import type {
  CulturalPlaceListItem,
  CulturalPlaceSort,
  CulturalPlaceStatsResponse,
  PartnerPublic,
} from "@yunicity/types";
import type { PartnerPlaceCard, PlacesCategoryFilterId } from "@yunicity/utils";
import {
  PLACES_PAGE_SIZE,
  buildPartnerPlaceCards,
  filterPlacesByCategoryGroup,
  filterPlacesBySearch,
  pickFeaturedPlaces,
  pickRecentPlaces,
  selectPlacesNewBadgeIds,
  sortPlacesLocally,
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
  const [partners, setPartners] = useState<PartnerPublic[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // La ville provient du paramètre d'URL ou de la session déjà chargée par
      // AuthProvider. On évite un appel `getProfileMe()` bloquant (et son retry
      // refresh sur 401 pour les visiteurs anonymes) avant le catalogue.
      const resolvedCity = cityParam.trim() || user?.city?.trim() || DEFAULT_CITY;
      setCity(resolvedCity);

      const [statsRes, featuredRes, catalogRes, partnersRes] = await Promise.all([
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
        api.listPartners({ city: resolvedCity, limit: 50 }),
      ]);

      setStats(statsRes);
      setFeatured(
        featuredRes.items.length > 0 ? featuredRes.items : pickFeaturedPlaces(catalogRes.items, 8),
      );
      setCatalog(catalogRes.items);
      setPartners(partnersRes.items);
      setVisibleCount(PLACES_PAGE_SIZE);
    } catch {
      setStats(null);
      setCatalog([]);
      setFeatured([]);
      setPartners([]);
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
    const bySearch = filterPlacesBySearch(byCategory, searchQuery);
    return sortPlacesLocally(bySearch, sort);
  }, [catalog, categoryFilter, searchQuery, sort]);

  const recentPlaces = useMemo(
    () => pickRecentPlaces(filteredPlaces, visibleCount),
    [filteredPlaces, visibleCount],
  );

  useEffect(() => {
    setVisibleCount(PLACES_PAGE_SIZE);
  }, [categoryFilter, searchQuery, sort]);

  const hasMore = visibleCount < filteredPlaces.length;

  const newBadgeIds = useMemo(
    () => selectPlacesNewBadgeIds(filteredPlaces),
    [filteredPlaces],
  );

  const partnerCards: PartnerPlaceCard[] = useMemo(
    () => buildPartnerPlaceCards(partners).slice(0, 6),
    [partners],
  );

  const showPartnersOnly = categoryFilter === "partners";

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PLACES_PAGE_SIZE, filteredPlaces.length));
  }, [filteredPlaces.length]);

  return {
    city,
    stats,
    featured,
    recentPlaces,
    partnerCards,
    partners,
    showPartnersOnly,
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
