/** Local events / city moments (TICKET-505). */

import type { FeedNeighborhoodSummary } from "./neighborhood";
import type { EventReadinessFields } from "./event-readiness";
import type { PartnerStatus } from "./partner";

export interface LocalEventOrganization {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo_url: string | null;
  is_verified?: boolean;
  is_partner?: boolean;
  partner_status?: PartnerStatus | null;
  created_at?: string | null;
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
  /** Présent sur les réponses API ; optionnel dans les mocks de tests. */
  interest_count?: number;
  organization: LocalEventOrganization | null;
  neighborhood_summary?: FeedNeighborhoodSummary | null;
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
  interest_count: number;
}

export interface FeedEventMeta {
  local_event_id: string;
  starts_at: string;
  ends_at: string | null;
  location_name: string;
  district: string | null;
  event_type: string | null;
  interested_by_me?: boolean;
}

export interface PartnerEventsParams {
  upcoming_only?: boolean;
  limit?: number;
  offset?: number;
}

/** Organization self-service (TICKET-505 / WEB-PARTNERS-08C). */
export interface LocalEventManagement extends LocalEvent {
  rejection_reason?: string | null;
  readiness: EventReadinessFields;
}

export interface LocalEventManagementListResponse {
  items: LocalEventManagement[];
  total: number;
  page: number;
  page_size: number;
}

export interface LocalEventCreatePayload {
  organization_id: string;
  title: string;
  description?: string | null;
  event_type?: string | null;
  city: string;
  district?: string | null;
  starts_at: string;
  ends_at?: string | null;
  timezone?: string;
  location_name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cover_image_url?: string | null;
}

export interface LocalEventUpdatePayload {
  title?: string;
  description?: string | null;
  event_type?: string | null;
  district?: string | null;
  starts_at?: string;
  ends_at?: string | null;
  location_name?: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cover_image_url?: string | null;
}

export interface LocalEventManagementListParams {
  organization_id?: string;
  page?: number;
  page_size?: number;
}
