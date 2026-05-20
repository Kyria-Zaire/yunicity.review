/** Local events / city moments (TICKET-505). */

export interface LocalEventOrganization {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo_url: string | null;
}

export interface LocalEvent {
  id: string;
  organization_id: string | null;
  title: string;
  description: string | null;
  event_type: string | null;
  city: string;
  district: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  location_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_image_url: string | null;
  moderation_status: string;
  is_cancelled: boolean;
  interested_by_me: boolean;
  organization: LocalEventOrganization | null;
  created_at: string;
}

export interface LocalEventListResponse {
  items: LocalEvent[];
  total: number;
  page: number;
  page_size: number;
}

export interface EventInterestToggleResponse {
  event_id: string;
  interested: boolean;
}

export interface FeedEventMeta {
  local_event_id: string;
  starts_at: string;
  ends_at: string | null;
  location_name: string;
  district: string | null;
  event_type: string | null;
}
