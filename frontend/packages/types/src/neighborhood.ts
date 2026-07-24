/** Neighborhood catalog types (TICKET-602 / 603 / FEATURE-QUARTIERS-V2). */

export interface FeedNeighborhoodSummary {
  slug: string;
  display_name: string;
}

export interface NeighborhoodAliasItem {
  id: string;
  name: string;
  slug: string;
  is_primary: boolean;
}

export interface NeighborhoodTimelineItem {
  id: string;
  year: number;
  title: string;
  description: string | null;
  display_order: number;
}

/** Tribu publique suggérée par un tag communauté (QUARTIER-01 phase 3f). */
export interface NeighborhoodTribeSuggestionItem {
  id: string;
  slug: string;
  name: string;
}

/**
 * Lieu emblématique dérivé d'un cultural_place (QUARTIER-01 phase 3a/3f).
 * L'attribution (photo_credit + image_license) voyage AVEC l'image : une photo CC BY-SA
 * réutilisée — y compris en cover de quartier — doit toujours afficher son crédit.
 */
export interface NeighborhoodLandmarkItem {
  slug: string;
  name: string;
  category: string;
  hero_image_url: string | null;
  photo_credit: string | null;
  image_license: string | null;
}

/** Tag communauté + tribus publiques suggérées (résolues par catégorie). tribes [] = honnête. */
export interface NeighborhoodCommunityTagItem {
  slug: string;
  label: string;
  tribes: NeighborhoodTribeSuggestionItem[];
}

export interface Neighborhood {
  id: string;
  city: string;
  slug: string;
  display_name: string;
  short_description: string | null;
  ambiance: string | null;
  cover_image_url: string | null;
  accent_color: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  long_story?: string | null;
  featured_quote?: string | null;
  // Identité et vie du quartier (QUARTIER-01 phase 3a), peuplées sur le détail (3f).
  audience?: string | null;
  neighborhood_type?: string | null;
  local_life?: string | null;
  green_spaces?: string | null;
  mobility?: string | null;
  daily_life?: string | null;
  aliases?: NeighborhoodAliasItem[];
  moods?: string[];
  timeline?: NeighborhoodTimelineItem[];
  community_tags?: NeighborhoodCommunityTagItem[];
  landmarks?: NeighborhoodLandmarkItem[];
}

export interface NeighborhoodListResponse {
  items: Neighborhood[];
  total: number;
  page: number;
  page_size: number;
}

export interface NeighborhoodContextStats {
  events_count: number;
  organizations_count: number;
  offers_count: number;
  posts_count: number;
}

export interface NeighborhoodContextEventItem {
  id: string;
  title: string;
  starts_at: string;
  location_name: string;
}

export interface NeighborhoodContextOrganizationItem {
  id: string;
  name: string;
  slug: string;
}

export interface NeighborhoodContextOfferItem {
  id: string;
  title: string;
  organization_name: string;
}

export interface NeighborhoodContextPostItem {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  created_at: string;
}

export interface NeighborhoodContextResponse {
  neighborhood: Neighborhood;
  stats: NeighborhoodContextStats;
  recent_events: NeighborhoodContextEventItem[];
  organizations: NeighborhoodContextOrganizationItem[];
  recent_offers: NeighborhoodContextOfferItem[];
  recent_posts: NeighborhoodContextPostItem[];
}

/** Quartier vivant — blocs structurés (FEATURE-QUARTIERS-V2 / Q2-S1-03). */

export interface NeighborhoodDetailHero {
  id: string;
  slug: string;
  display_name: string;
  official_label: string;
  aliases: NeighborhoodAliasItem[];
  moods: string[];
  featured_quote: string | null;
  cover_image_url: string | null;
  hero_image_storage_key: string | null;
}

export interface NeighborhoodDetailHistory {
  long_story: string | null;
  featured_quote: string | null;
}

export interface NeighborhoodDetailVideoAuthor {
  id: string;
  username: string | null;
  full_name: string;
  avatar_url: string | null;
}

export interface NeighborhoodDetailVideoItem {
  id: string;
  title: string | null;
  thumbnail_url: string;
  duration_seconds: number;
  neighborhood_slug: string;
  published_at: string | null;
  video_type: string;
  author: NeighborhoodDetailVideoAuthor;
}

export interface NeighborhoodDetailPlaceItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  image_url: string | null;
  is_partner: boolean;
}

export interface NeighborhoodDetailEventItem {
  id: string;
  title: string;
  starts_at: string;
  location_name: string;
  cover_image_url: string | null;
}

export interface NeighborhoodDetailPassportOfferItem {
  id: string;
  title: string;
  organization_name: string;
}

export interface NeighborhoodDetailContributionItem {
  id: string;
  title: string | null;
  body: string;
  author_label: string;
  passport_verified_snapshot: boolean;
  approved_at: string | null;
  created_at: string;
}

export type NeighborhoodContributionIdentityType = "PSEUDO" | "ANONYMOUS" | "VERIFIED";

export type NeighborhoodContributionAnonymousGender = "remois" | "remoise";

export interface NeighborhoodContributionSubmitRequest {
  identity_type: NeighborhoodContributionIdentityType;
  title?: string | null;
  body: string;
  anonymous_gender?: NeighborhoodContributionAnonymousGender | null;
}

export interface NeighborhoodContributionSubmitResponse {
  id: string;
  status: string;
  submitted_at: string;
  message: string;
}

export interface NeighborhoodContributionMeNeighborhood {
  id: string;
  slug: string;
  display_name: string;
}

export type NeighborhoodContributionMeStatus = "pending" | "approved" | "rejected";

export interface NeighborhoodContributionMeItem {
  id: string;
  neighborhood: NeighborhoodContributionMeNeighborhood;
  title: string | null;
  body: string;
  status: NeighborhoodContributionMeStatus;
  submitted_at: string;
  approved_at: string | null;
  reviewed_at: string | null;
  display_identity_label: string;
  display_identity_type: string;
  passport_verified_snapshot: boolean;
  rejection_reason_code: string | null;
  rejection_message: string | null;
}

export interface NeighborhoodContributionMeListResponse {
  items: NeighborhoodContributionMeItem[];
}

export interface NeighborhoodDetailTribeItem {
  id: string;
  slug: string;
  name: string;
}

export interface NeighborhoodDetailCreatorItem {
  id: string;
  username: string | null;
  full_name: string;
  avatar_url: string | null;
}

export interface NeighborhoodDetailStats {
  places_count: number;
  events_count: number;
  videos_count: number;
  tribes_count: number;
  creators_count: number;
  contributions_count: number;
}

export interface NeighborhoodDetail extends Neighborhood {
  hero: NeighborhoodDetailHero | null;
  history: NeighborhoodDetailHistory | null;
  videos: NeighborhoodDetailVideoItem[];
  places: NeighborhoodDetailPlaceItem[];
  events: NeighborhoodDetailEventItem[];
  tribes: NeighborhoodDetailTribeItem[];
  creators: NeighborhoodDetailCreatorItem[];
  passport_offers: NeighborhoodDetailPassportOfferItem[];
  contributions: NeighborhoodDetailContributionItem[];
  stats: NeighborhoodDetailStats | null;
}
