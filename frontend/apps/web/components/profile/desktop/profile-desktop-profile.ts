import type { ProfileMe, ProfilePublic } from "@yunicity/types";

/** Champs communs header / sidebar / aperçu profil desktop (owner ou visiteur). */
export type ProfileDesktopProfile = Pick<
  ProfileMe | ProfilePublic,
  | "username"
  | "display_name"
  | "bio"
  | "avatar_url"
  | "banner_url"
  | "city"
  | "interests"
> & {
  created_at?: string;
  onboarding_completed?: boolean;
};

export function toProfileDesktopProfile(profile: ProfileMe | ProfilePublic): ProfileDesktopProfile {
  if ("created_at" in profile) {
    return profile;
  }
  return profile;
}
