export type ProfileVisibility = "public" | "private" | "city_only";

export interface ProfileMe {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  city: string | null;
  interests: string[];
  visibility: ProfileVisibility;
  onboarding_completed: boolean;
  onboarding_step: string | null;
  preferred_language: string | null;
  notification_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProfilePublic {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  city: string | null;
  interests: string[];
}

export interface ProfileUpdateRequest {
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  city?: string | null;
  interests?: string[];
  visibility?: ProfileVisibility;
  preferred_language?: string | null;
}

export interface ProfileCompleteRequest {
  city?: string | null;
  interests?: string[];
}

/** Alias produit — profil connecté. */
export type UserProfile = ProfileMe;
