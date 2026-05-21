/** Event map API types (FEATURE-D / TICKET-D.3–D.4). */

export type MapBbox = {
  lat_min: number;
  lon_min: number;
  lat_max: number;
  lon_max: number;
};

export type MapBboxResponse = MapBbox;

export type MapNeighborhoodSummary = {
  slug: string;
  display_name: string;
};

export type MapEventItem = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  district: string | null;
  starts_at: string;
  ends_at: string | null;
  location_name: string;
  latitude: number;
  longitude: number;
  neighborhood_summary: MapNeighborhoodSummary | null;
};

export type MapEventsListParams = MapBbox & {
  city: string;
  limit?: number;
};

export type MapEventListResponse = {
  city: string | null;
  bbox: MapBboxResponse;
  count: number;
  truncated: boolean;
  events: MapEventItem[];
};
