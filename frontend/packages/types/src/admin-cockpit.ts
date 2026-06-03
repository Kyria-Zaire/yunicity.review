/** Admin cockpit summary (ADMIN-01A / ADMIN-01B). */

export interface AdminCockpitExecutive {
  users_total: number;
  users_active: number;
  passports_total: number;
  partners_total: number;
  offers_total: number;
  events_total: number;
  creator_contents_total: number;
  partner_leads_total: number;
}

export interface AdminCockpitAttention {
  offers_pending: number;
  creator_contents_pending: number;
  events_pending: number;
  partner_leads_open: number;
  organizations_pending_review: number;
}

export interface AdminCockpitPartners {
  active: number;
  signed: number;
  premium: number;
  founding_partner: number;
  paused: number;
  public: number;
  private: number;
  verified: number;
  pending_review: number;
}

export interface AdminCockpitPassport {
  passports_total: number;
  stamps_total: number;
  qr_stamps: number;
  partner_stamps: number;
  redemptions_total: number;
  redemptions_completed: number;
}

export interface AdminCockpitSummaryResponse {
  generated_at: string;
  city: string;
  executive: AdminCockpitExecutive;
  attention: AdminCockpitAttention;
  partners: AdminCockpitPartners;
  passport: AdminCockpitPassport;
}

export interface AdminCockpitSummaryParams {
  city?: string;
}
