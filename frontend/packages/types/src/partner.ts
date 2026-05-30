/** Signed partners API types (WEB-PARTNERS-01). */

export type PartnerStatus =
  | "signed"
  | "active"
  | "paused"
  | "premium"
  | "founding_partner";

export type PartnershipType =
  | "local_business"
  | "association"
  | "sports_club"
  | "restaurant"
  | "nightlife"
  | "creator_partner"
  | "institutional"
  | "internal_project";

/** Public partner payload — no internal CRM fields. */
export type PartnerPublic = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  category: string | null;
  city: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  is_featured: boolean;
  partner_status: PartnerStatus;
  partnership_type: PartnershipType;
  public_partner_label: string | null;
  address: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  website_url: string | null;
  phone: string | null;
  instagram_url: string | null;
  is_verified: boolean;
};

export type PartnerListResponse = {
  city: string;
  items: PartnerPublic[];
  count: number;
  total: number;
  offset: number;
  limit: number;
};

export type PartnerListParams = {
  city: string;
  status?: PartnerStatus;
  type?: PartnershipType;
  featured?: boolean;
  limit?: number;
  offset?: number;
};
