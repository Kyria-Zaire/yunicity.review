/** Admin partners workspace summary (ADMIN-PARTNERS-UX-01). */

export interface AdminPartnersCategoryBreakdownItem {
  key: string;
  count: number;
}

export interface AdminPartnersTopActiveItem {
  organization_id: string;
  name: string;
  logo_url: string | null;
  interactions_count: number;
}

export interface AdminPartnersPendingRequestItem {
  organization_id: string;
  name: string;
  organization_type: string;
  requested_at: string;
}

export interface AdminPartnersMapPin {
  organization_id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface AdminPartnersEvolutionPoint {
  date: string;
  cumulative_total: number;
  new_count: number;
}

export interface AdminPartnersWorkspaceSummary {
  generated_at: string;
  city: string;
  leads_total: number;
  leads_open: number;
  organizations_pending_review: number;
  partners_total: number;
  partners_active: number;
  partners_signed: number;
  partners_premium: number;
  partners_founding: number;
  partners_verified: number;
  partners_public: number;
  partners_private: number;
  activation_waves_open: number;
  activation_items_total: number;
  activation_items_ready: number;
  activation_items_activated: number;
  partners_inactive: number;
  partners_new_this_month: number;
  category_breakdown: AdminPartnersCategoryBreakdownItem[];
  top_active_partners: AdminPartnersTopActiveItem[];
  pending_requests: AdminPartnersPendingRequestItem[];
  map_pins: AdminPartnersMapPin[];
  evolution_30d: AdminPartnersEvolutionPoint[];
}

export interface AdminPartnersWorkspaceSummaryParams {
  city?: string;
}

export interface AdminPartnersTerrainListItem {
  organization_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  organization_type: string;
  partnership_type: string | null;
  category: string | null;
  neighborhood_name: string | null;
  address: string | null;
  city: string;
  verification_status: string;
  partner_status: string | null;
  stamps_count: number;
  updated_at: string;
}

export interface AdminPartnersTerrainListParams {
  city?: string;
  search?: string;
  status?: "active" | "pending" | "verified" | "inactive";
  partnership_type?: string;
  organization_type?: string;
  page?: number;
  page_size?: number;
}

export interface AdminPartnersTerrainListResponse {
  items: AdminPartnersTerrainListItem[];
  total: number;
  page: number;
  page_size: number;
}
