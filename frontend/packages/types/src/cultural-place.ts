/** Cultural places API types (WEB-MAP-03). */

export type CulturalPlaceNeighborhoodSummary = {
  slug: string;
  display_name: string;
};

export type CulturalPlaceListItem = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  city: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  image_alt: string | null;
  source_name: string;
  image_credit: string | null;
  neighborhood: CulturalPlaceNeighborhoodSummary | null;
};

export type CulturalPlaceDetail = CulturalPlaceListItem & {
  description: string | null;
  source_url: string | null;
  image_license: string | null;
  is_featured: boolean;
};

export type CulturalPlaceListResponse = {
  city: string;
  items: CulturalPlaceListItem[];
  count: number;
};

export type MapCulturalPlaceItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  address: string;
  city: string;
  neighborhood: CulturalPlaceNeighborhoodSummary | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
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
