"use client";

import { ProfileCompactHeroHeader } from "@/components/profile/profile-compact-hero-header";
import type { ProfileMe } from "@yunicity/types";
import type { ProfileDesktopTabId } from "@yunicity/utils";

type ProfileMediumHeroHeaderProps = {
  profile: ProfileMe;
  activeTab: ProfileDesktopTabId;
  onTabChange: (tab: ProfileDesktopTabId) => void;
};

/** Hero profil medium — carte arrondie + identité + onglets. */
export function ProfileMediumHeroHeader({
  profile,
  activeTab,
  onTabChange,
}: ProfileMediumHeroHeaderProps) {
  return (
    <ProfileCompactHeroHeader
      profile={profile}
      activeTab={activeTab}
      onTabChange={onTabChange}
      variant="medium"
    />
  );
}
