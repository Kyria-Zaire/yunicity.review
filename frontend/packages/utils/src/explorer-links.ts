import type { SearchTypeFilter } from "@yunicity/types";

import { SEARCH_TAB_SLUGS, searchTabFromUrlParam, searchTabToUrlParam } from "./search-labels";

export type ParsedSearchParams = {
  q: string;
  city: string;
  tab: SearchTypeFilter;
};

export type ParsedMapParams = {
  city: string;
  place: string;
  partner: string;
  event: string;
  neighborhood: string;
  tribe: string;
  layer: string;
  route: boolean;
};

export function buildSearchUrl(input?: {
  q?: string | null;
  city?: string | null;
  tab?: SearchTypeFilter | null;
}): string {
  const params = new URLSearchParams();
  const q = input?.q?.trim() ?? "";
  const city = input?.city?.trim() ?? "";
  const tab = input?.tab ?? "all";

  if (q.length >= 2) params.set("q", q);
  if (city) params.set("city", city);
  const tabSlug = searchTabToUrlParam(tab);
  if (tabSlug) params.set("tab", tabSlug);

  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export function parseSearchParams(params: URLSearchParams): ParsedSearchParams {
  return {
    q: params.get("q")?.trim() ?? "",
    city: params.get("city")?.trim() ?? "",
    tab: searchTabFromUrlParam(params.get("tab")),
  };
}

export function buildPartnerMapUrl(
  slug: string,
  options?: { city?: string | null; route?: boolean },
): string {
  const params = new URLSearchParams();
  const cleanSlug = slug.trim();
  if (cleanSlug) params.set("partner", cleanSlug);
  const city = options?.city?.trim();
  if (city) params.set("city", city);
  if (options?.route) params.set("route", "1");
  return `/map?${params.toString()}`;
}

export function buildMapPlaceUrl(slug: string, options?: { city?: string | null; route?: boolean }): string {
  const params = new URLSearchParams();
  const cleanSlug = slug.trim();
  if (cleanSlug) params.set("place", cleanSlug);
  const city = options?.city?.trim();
  if (city) params.set("city", city);
  if (options?.route) params.set("route", "1");
  return `/map?${params.toString()}`;
}

export function buildMapNeighborhoodUrl(
  slug: string,
  options?: { city?: string | null; route?: boolean },
): string {
  const params = new URLSearchParams();
  const cleanSlug = slug.trim();
  if (cleanSlug) params.set("neighborhood", cleanSlug);
  const city = options?.city?.trim();
  if (city) params.set("city", city);
  if (options?.route) params.set("route", "1");
  return `/map?${params.toString()}`;
}

export function buildMapEventUrl(eventId: string, options?: { city?: string | null; route?: boolean }): string {
  const params = new URLSearchParams();
  const cleanEventId = eventId.trim();
  if (cleanEventId) params.set("event", cleanEventId);
  const city = options?.city?.trim();
  if (city) params.set("city", city);
  if (options?.route) params.set("route", "1");
  return `/map?${params.toString()}`;
}

export function parseMapParams(params: URLSearchParams): ParsedMapParams {
  const routeRaw = params.get("route")?.trim().toLowerCase() ?? "";
  return {
    city: params.get("city")?.trim() ?? "",
    place: params.get("place")?.trim() ?? "",
    partner: params.get("partner")?.trim() ?? "",
    event: params.get("event")?.trim() ?? "",
    neighborhood: params.get("neighborhood")?.trim() ?? "",
    tribe: params.get("tribe")?.trim() ?? "",
    layer: params.get("layer")?.trim() ?? "",
    route: routeRaw === "1" || routeRaw === "true",
  };
}

export function isValidSearchTabSlug(slug: string): boolean {
  return Object.values(SEARCH_TAB_SLUGS).includes(slug as SearchTypeFilter);
}
