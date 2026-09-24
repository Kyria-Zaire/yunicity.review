import type { SearchGroupKey, SearchGroups, SearchResultGroup, SearchTypeFilter } from "@yunicity/types";

import { buildSearchUrl } from "./explorer-links";
import {
  SEARCH_DESKTOP_CONTENT_TYPES,
  SEARCH_DESKTOP_GROUP_LABELS,
  SEARCH_DESKTOP_OTHER_RESULTS,
  type SearchDesktopContentTypeId,
  type SearchDesktopPeriodPreset,
} from "./search-desktop-labels";
import { searchTypeFilterFromGroupKey, visibleSearchGroups } from "./search-desktop-groups";

export const SEARCH_DESKTOP_PRIMARY_GROUPS: readonly SearchGroupKey[] = [
  "events",
  "tribes",
  "posts",
  "organizations",
] as const;

export const SEARCH_DESKTOP_SECONDARY_GROUPS: readonly SearchGroupKey[] = [
  "offers",
  "users",
  "neighborhoods",
] as const;

export type SearchDesktopGroupSection = {
  key: SearchGroupKey;
  group: SearchResultGroup;
  label: string;
  viewAllHref: string;
};

export type SearchDesktopOtherResultRow = {
  id: string;
  groupKey: SearchGroupKey;
  label: string;
  subtitle: string;
  href: string;
  tab: SearchTypeFilter;
};

export function defaultSearchDesktopContentTypes(): SearchDesktopContentTypeId[] {
  return SEARCH_DESKTOP_CONTENT_TYPES.map((item) => item.id);
}

export function searchDesktopGroupLabel(key: SearchGroupKey): string {
  return SEARCH_DESKTOP_GROUP_LABELS[key];
}

export function searchDesktopPeriodToApi(
  preset: SearchDesktopPeriodPreset,
): "all" | "upcoming" | "past" {
  if (preset === "all") return "all";
  return "upcoming";
}

export function groupKeyFromContentType(type: SearchDesktopContentTypeId): SearchGroupKey {
  return SEARCH_DESKTOP_CONTENT_TYPES.find((item) => item.id === type)?.groupKey ?? "events";
}

export function isGroupVisibleForContentTypes(
  groupKey: SearchGroupKey,
  enabledTypes: readonly SearchDesktopContentTypeId[],
): boolean {
  const allowed = new Set(enabledTypes.map(groupKeyFromContentType));
  return allowed.has(groupKey);
}

export function buildSearchDesktopResultSections(input: {
  groups: SearchGroups;
  typeFilter: SearchTypeFilter;
  query: string;
  city: string;
  enabledContentTypes: readonly SearchDesktopContentTypeId[];
}): SearchDesktopGroupSection[] {
  if (input.typeFilter !== "all") {
    const key = FILTER_TO_GROUP[input.typeFilter];
    const group = input.groups[key];
    if (group.items.length === 0 && group.count === 0) return [];
    return [
      {
        key,
        group,
        label: searchDesktopGroupLabel(key),
        viewAllHref: buildSearchUrl({
          q: input.query,
          city: input.city,
          tab: input.typeFilter,
        }),
      },
    ];
  }

  return buildSearchDesktopPrimarySections(input);
}

const FILTER_TO_GROUP: Record<Exclude<SearchTypeFilter, "all">, SearchGroupKey> = {
  event: "events",
  post: "posts",
  organization: "organizations",
  offer: "offers",
  tribe: "tribes",
  user: "users",
  neighborhood: "neighborhoods",
};

export function buildSearchDesktopPrimarySections(input: {
  groups: SearchGroups;
  typeFilter: SearchTypeFilter;
  query: string;
  city: string;
  enabledContentTypes: readonly SearchDesktopContentTypeId[];
}): SearchDesktopGroupSection[] {
  const visible = visibleSearchGroups(input.groups, input.typeFilter);
  const visibleKeys = new Set(visible.map(({ key }) => key));

  return SEARCH_DESKTOP_PRIMARY_GROUPS.filter((key) => {
    if (!visibleKeys.has(key)) return false;
    const group = input.groups[key];
    if (group.items.length === 0 && group.count === 0) return false;
    if (input.typeFilter === "all" && !isGroupVisibleForContentTypes(key, input.enabledContentTypes)) {
      return false;
    }
    return true;
  }).map((key) => ({
    key,
    group: input.groups[key],
    label: searchDesktopGroupLabel(key),
    viewAllHref: buildSearchUrl({
      q: input.query,
      city: input.city,
      tab: searchTypeFilterFromGroupKey(key),
    }),
  }));
}

export function buildSearchDesktopOtherRows(input: {
  groups: SearchGroups;
  typeFilter: SearchTypeFilter;
  query: string;
  city: string;
  enabledContentTypes: readonly SearchDesktopContentTypeId[];
  rowLabel: (groupKey: SearchGroupKey, title: string) => string;
  rowSubtitle: (groupKey: SearchGroupKey, count: number) => string;
  rowHref: (groupKey: SearchGroupKey) => string;
}): SearchDesktopOtherResultRow[] {
  if (input.typeFilter !== "all") return [];

  return SEARCH_DESKTOP_SECONDARY_GROUPS.flatMap((groupKey) => {
    if (!isGroupVisibleForContentTypes(groupKey, input.enabledContentTypes)) return [];
    const group = input.groups[groupKey];
    if (group.items.length === 0 && group.count === 0) return [];
    const first = group.items[0];
    const title = first?.title ?? first?.name ?? first?.username ?? searchDesktopGroupLabel(groupKey);
    return [
      {
        id: groupKey,
        groupKey,
        label: input.rowLabel(groupKey, title),
        subtitle: input.rowSubtitle(groupKey, group.count),
        href: input.rowHref(groupKey),
        tab: searchTypeFilterFromGroupKey(groupKey),
      },
    ];
  });
}

export function searchDesktopOtherResultsTitle(): string {
  return SEARCH_DESKTOP_OTHER_RESULTS;
}

export function searchDesktopHasAnyResults(
  groups: SearchGroups,
  typeFilter: SearchTypeFilter,
  enabledContentTypes: readonly SearchDesktopContentTypeId[],
): boolean {
  const sections = buildSearchDesktopResultSections({
    groups,
    typeFilter,
    query: "",
    city: "",
    enabledContentTypes,
  });
  if (sections.length > 0) return true;
  return buildSearchDesktopOtherRows({
    groups,
    typeFilter,
    query: "",
    city: "",
    enabledContentTypes,
    rowLabel: (_, title) => title,
    rowSubtitle: (_, count) => String(count),
    rowHref: () => "/search",
  }).length > 0;
}
