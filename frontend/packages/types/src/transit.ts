/** Grand Reims transit API types (WEB-MAP-02). */

export type TransitMode = "scheduled" | "realtime";

export type TransitDeparture = {
  route_short_name: string;
  route_type: string;
  headsign: string;
  scheduled_at: string;
  minutes?: number | null;
  realtime: boolean;
};

export type TransitStopNearby = {
  stop_id: string;
  name: string;
  distance_meters: number;
  departures: TransitDeparture[];
};

export type TransitNearbyParams = {
  lat: number;
  lon: number;
  city?: string;
  radius_meters?: number;
  limit?: number;
  max_minutes?: number;
};

export type TransitNearbyResponse = {
  city: string;
  source: string;
  mode: TransitMode;
  disclaimer: string;
  stops: TransitStopNearby[];
};
