import type { SearchGroupKey, SearchGroups, SearchResultGroup, SearchTypeFilter } from "@yunicity/types";

import { SEARCH_GROUP_ORDER } from "./search-labels";

export function searchTypeFilterFromGroupKey(groupKey: SearchGroupKey): SearchTypeFilter {
  const map: Record<SearchGroupKey, SearchTypeFilter> = {
    events: "event",
    organizations: "organization",
    posts: "post",
    offers: "offer",
    tribes: "tribe",
    users: "user",
    neighborhoods: "neighborhood",
  };
  return map[groupKey];
}

export function visibleSearchGroups(
  groups: SearchGroups,
  typeFilter: SearchTypeFilter,
): Array<{ key: SearchGroupKey; group: SearchResultGroup }> {
  const entries = SEARCH_GROUP_ORDER.map((key) => ({ key, group: groups[key] }));
  if (typeFilter === "all") {
    return entries.filter(({ group }) => group.count > 0 || group.items.length > 0);
  }
  const map: Record<SearchTypeFilter, SearchGroupKey> = {
    all: "events",
    post: "posts",
    event: "events",
    organization: "organizations",
    offer: "offers",
    tribe: "tribes",
    user: "users",
    neighborhood: "neighborhoods",
  };
  const key = map[typeFilter];
  return [{ key, group: groups[key] }];
}
