export type OrganizationType =
  | "commerce"
  | "association"
  | "school"
  | "freelance"
  | "public_agency"
  | "creator"
  | "other";

export type VerificationStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "suspended";

export type OrganizationVisibility = "private" | "public" | "unlisted";

export type OrganizationMemberRole = "owner" | "admin" | "staff" | "member";

export type OrganizationMemberStatus = "active" | "invited" | "suspended" | "removed";

export interface OrganizationMeItem {
  id: string;
  slug: string;
  name: string;
  type: OrganizationType;
  city: string;
  verification_status: VerificationStatus;
  visibility: OrganizationVisibility;
  onboarding_completed: boolean;
  member_role: OrganizationMemberRole;
  member_status: OrganizationMemberStatus;
}

export interface OrganizationMeListResponse {
  items: OrganizationMeItem[];
}

export interface OrganizationCreateRequest {
  name: string;
  type: OrganizationType;
  city: string;
  category?: string | null;
  address?: string | null;
  postal_code?: string | null;
  description?: string | null;
  website?: string | null;
  phone?: string | null;
}

/** Payload formulaire frontend (instagram fusionné en description côté API). */
export interface OrganizationRequestPayload {
  name: string;
  type: OrganizationType;
  city: string;
  address?: string | null;
  website?: string | null;
  instagram?: string | null;
  description?: string | null;
}

/** Alias produit — organization dans la liste membre. */
export type OrganizationSummary = OrganizationMeItem;

export interface OrganizationCreateResponse {
  id: string;
  slug: string;
  name: string;
  verification_status: VerificationStatus;
  visibility: OrganizationVisibility;
}

export interface OrganizationPublic {
  slug: string;
  name: string;
  description: string | null;
  type: OrganizationType;
  category: string | null;
  city: string;
  address: string | null;
  postal_code: string | null;
  website: string | null;
  phone: string | null;
  social_links: Record<string, string>;
  logo_url: string | null;
  banner_url: string | null;
}
