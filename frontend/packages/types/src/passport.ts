export type PassportTierCode =
  | "basic"
  | "silver"
  | "gold"
  | "neo_arrivant"
  | "press_creator"
  | "business";

export type PassportStatus = "active" | "suspended" | "revoked";

export type PassportStampSource = "organization";

export type PartnerOfferType =
  | "drink"
  | "discount"
  | "vip"
  | "gift"
  | "event_access"
  | "custom";

export type OfferRedemptionStatus = "pending" | "completed" | "cancelled" | "failed";

export interface PassportTier {
  id: string;
  code: PassportTierCode;
  name: string;
  description: string | null;
  display_order: number;
  flags: Record<string, unknown>;
}

export interface PassportStats {
  stamps_count: number;
  redemptions_count: number;
  last_stamp_at: string | null;
}

export interface PassportProgressionHint {
  next_tier_code: PassportTierCode | null;
  next_tier_label: string | null;
  hint: string | null;
  reputation_score: number;
  points_to_next: number | null;
}

export interface PassportMe {
  id: string;
  user_id: string;
  city: string;
  passport_number: string;
  qr_token: string;
  status: PassportStatus;
  tier: PassportTier;
  stats: PassportStats;
  reputation_score?: number;
  progression?: PassportProgressionHint | null;
  tier_unlocked_at?: string | null;
  onboarding_completed: boolean;
  onboarding_step: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PassportActivateRequest {
  city?: string | null;
}

export interface PassportStampOrganization {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo_url: string | null;
}

export interface PassportStamp {
  id: string;
  passport_id: string;
  organization_id: string;
  stamp_source: PassportStampSource;
  stamped_at: string;
  organization: PassportStampOrganization;
}

export interface PassportStampListResponse {
  items: PassportStamp[];
  total: number;
}

export interface PassportTierListResponse {
  items: PassportTier[];
}

export interface PartnerOfferOrganization {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo_url: string | null;
}

export interface PartnerOffer {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  offer_type: PartnerOfferType;
  tier_code_required: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_flash?: boolean;
  flash_ends_at?: string | null;
  remaining_hours?: number | null;
  remaining_minutes?: number | null;
  organization: PartnerOfferOrganization;
}

export interface PartnerOfferListResponse {
  items: PartnerOffer[];
  total: number;
}

export interface Redemption {
  id: string;
  passport_id: string;
  partner_offer_id: string;
  status: OfferRedemptionStatus;
  redeemed_at: string | null;
  created_at: string;
}
