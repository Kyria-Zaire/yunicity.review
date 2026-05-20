/** Local search API types (FEATURE-B / TICKET-B.5). */

export type SearchEntityType =
  | "post"
  | "event"
  | "org"
  | "offer"
  | "tribe"
  | "user"
  | "neighborhood";

export type SearchTypeFilter =
  | "all"
  | "post"
  | "event"
  | "organization"
  | "offer"
  | "tribe"
  | "user"
  | "neighborhood";

export type SearchGroupKey =
  | "events"
  | "organizations"
  | "posts"
  | "offers"
  | "tribes"
  | "users"
  | "neighborhoods";

export type SearchResultItem = {
  id: string;
  rank: number;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  city?: string | null;
  body?: string | null;
  username?: string | null;
  starts_at?: string | null;
  is_flash?: boolean | null;
};

export type SearchResultGroup = {
  items: SearchResultItem[];
  count: number;
  has_more: boolean;
};

export type SearchGroups = {
  events: SearchResultGroup;
  organizations: SearchResultGroup;
  posts: SearchResultGroup;
  offers: SearchResultGroup;
  tribes: SearchResultGroup;
  users: SearchResultGroup;
  neighborhoods: SearchResultGroup;
};

export type SearchListParams = {
  q: string;
  city?: string;
  neighborhood_slug?: string;
  type?: SearchTypeFilter;
  period?: "upcoming" | "past" | "all";
  page?: number;
  limit?: number;
};

export type SearchResponse = {
  query: string;
  city: string;
  neighborhood_slug?: string | null;
  type_filter: SearchEntityType | "all";
  ranking_explanation: string;
  groups: SearchGroups;
  page: number;
  page_size: number;
  has_more: boolean;
};
