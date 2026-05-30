import type { PartnerStatus } from "./partner";
import type { PartnerOfferType } from "./passport";

export type PartnerOfferPartnerSummary = {
  name: string;
  slug: string;
  logo_url: string | null;
  cover_image_url: string | null;
  category: string | null;
  city: string;
  is_verified: boolean;
  partner_status: PartnerStatus;
};

export type PartnerOfferPublic = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  value_label: string | null;
  offer_type: PartnerOfferType;
  conditions: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_featured: boolean;
  tier_code_required: string | null;
  partner: PartnerOfferPartnerSummary;
};

export type PartnerOfferPublicListResponse = {
  city: string;
  items: PartnerOfferPublic[];
  count: number;
  total: number;
  offset: number;
  limit: number;
};

export type PartnerOfferListParams = {
  city: string;
  partner_slug?: string;
  featured?: boolean;
  type?: PartnerOfferType;
  limit?: number;
  offset?: number;
};
