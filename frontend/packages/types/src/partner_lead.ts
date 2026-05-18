import type { OrganizationType } from "./organization";

export type PartnerLeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "meeting_scheduled"
  | "signed"
  | "converted"
  | "rejected"
  | "archived";

export type PartnerLeadSource =
  | "landing_page"
  | "physical_prospecting"
  | "referral"
  | "instagram"
  | "event"
  | "inbound"
  | "outbound"
  | "manual"
  | "other";

export interface PartnerLead {
  id: string;
  name: string;
  organization_type: OrganizationType | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  city: string | null;
  address: string | null;
  source: PartnerLeadSource;
  status: PartnerLeadStatus;
  interested_passport: boolean;
  interested_events: boolean;
  interested_creator_program: boolean;
  interested_offers: boolean;
  interested_business_passport: boolean;
  tags: string[];
  notes: string | null;
  internal_rating: number | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  converted_organization_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerLeadListResponse {
  items: PartnerLead[];
  total: number;
  page: number;
  page_size: number;
}

export interface PartnerLeadListParams {
  status?: PartnerLeadStatus;
  source?: PartnerLeadSource;
  city?: string;
  page?: number;
  page_size?: number;
}

export interface PartnerLeadUpdatePayload {
  status?: PartnerLeadStatus;
  notes?: string | null;
  tags?: string[];
  last_contacted_at?: string | null;
  next_followup_at?: string | null;
  internal_rating?: number | null;
  interested_passport?: boolean;
  interested_events?: boolean;
  interested_creator_program?: boolean;
  interested_offers?: boolean;
  interested_business_passport?: boolean;
}

export interface ConvertLeadPayload {
  owner_user_id: string;
  organization_id?: string | null;
}
