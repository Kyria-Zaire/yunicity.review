/** Neighborhood catalog types (TICKET-602 / 603). */

export interface FeedNeighborhoodSummary {
  slug: string;
  display_name: string;
}

export interface Neighborhood {
  id: string;
  city: string;
  slug: string;
  display_name: string;
  short_description: string | null;
  ambiance: string | null;
  cover_image_url: string | null;
  accent_color: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NeighborhoodListResponse {
  items: Neighborhood[];
  total: number;
  page: number;
  page_size: number;
}

export interface NeighborhoodContextStats {
  events_count: number;
  organizations_count: number;
  offers_count: number;
  posts_count: number;
}

export interface NeighborhoodContextEventItem {
  id: string;
  title: string;
  starts_at: string;
  location_name: string;
}

export interface NeighborhoodContextOrganizationItem {
  id: string;
  name: string;
  slug: string;
}

export interface NeighborhoodContextOfferItem {
  id: string;
  title: string;
  organization_name: string;
}

export interface NeighborhoodContextPostItem {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  created_at: string;
}

export interface NeighborhoodContextResponse {
  neighborhood: Neighborhood;
  stats: NeighborhoodContextStats;
  recent_events: NeighborhoodContextEventItem[];
  organizations: NeighborhoodContextOrganizationItem[];
  recent_offers: NeighborhoodContextOfferItem[];
  recent_posts: NeighborhoodContextPostItem[];
}
