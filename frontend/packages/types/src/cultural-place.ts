/** Cultural places API types (WEB-MAP-03, WEB-SEARCH-02B.1). */

export type CulturalPlaceNeighborhoodSummary = {
  slug: string;
  display_name: string;
};

export type CulturalGalleryImage = {
  url: string;
  alt?: string | null;
  credit?: string | null;
  source?: string | null;
};

export type CulturalPlaceMediaFields = {
  image_url: string | null;
  hero_image_url: string | null;
  thumbnail_image_url: string | null;
  gallery_images: CulturalGalleryImage[];
  editorial_excerpt: string | null;
  photo_credit: string | null;
  image_source: string | null;
};

export type CulturalPlaceListItem = CulturalPlaceMediaFields & {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  city: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  image_alt: string | null;
  source_name: string;
  image_credit: string | null;
  neighborhood: CulturalPlaceNeighborhoodSummary | null;
  is_featured?: boolean;
  created_at?: string;
};

export type CulturalPlaceDetail = CulturalPlaceListItem & {
  description: string | null;
  source_url: string | null;
  image_license: string | null;
  is_featured: boolean;
  featured_priority: number;
  image_blurhash: string | null;
};

export type CulturalPlaceListResponse = {
  city: string;
  items: CulturalPlaceListItem[];
  count: number;
  total: number;
  offset: number;
  limit: number;
};

export type CulturalPlaceStatsResponse = {
  city: string;
  total_places: number;
  new_this_month: number;
  category_count: number;
};

export type CulturalPlaceSort = "featured" | "name" | "recent";

export type MapCulturalPlaceItem = CulturalPlaceMediaFields & {
  id: string;
  slug: string;
  name: string;
  category: string;
  address: string;
  city: string;
  neighborhood: CulturalPlaceNeighborhoodSummary | null;
  latitude: number;
  longitude: number;
  image_alt: string | null;
  source_name: string;
  image_credit: string | null;
};

export type MapCulturalPlacesListParams = {
  lat_min: number;
  lon_min: number;
  lat_max: number;
  lon_max: number;
  city: string;
  limit?: number;
};

export type MapCulturalPlaceListResponse = {
  city: string;
  bbox: {
    lat_min: number;
    lon_min: number;
    lat_max: number;
    lon_max: number;
  };
  count: number;
  places: MapCulturalPlaceItem[];
};

export type MapRouteSummary = {
  distanceMeters: number;
  durationSeconds: number;
};

export type MapRouteGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};
