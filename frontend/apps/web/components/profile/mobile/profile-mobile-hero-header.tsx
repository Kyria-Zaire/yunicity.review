"use client";

import { ProfileCompactHeroHeader } from "@/components/profile/profile-compact-hero-header";
import type { ProfileMe } from "@yunicity/types";
import type { ProfileDesktopTabId } from "@yunicity/utils";

type ProfileMobileHeroHeaderProps = {
  profile: ProfileMe;
  activeTab: ProfileDesktopTabId;
  onTabChange: (tab: ProfileDesktopTabId) => void;
};

/** Hero profil mobile — cover full-bleed + identité + onglets (maquette). */
export function ProfileMobileHeroHeader({
  profile,
  activeTab,
  onTabChange,
}: ProfileMobileHeroHeaderProps) {
  return (
    <ProfileCompactHeroHeader
      profile={profile}
      activeTab={activeTab}
      onTabChange={onTabChange}
      variant="mobile"
    />
  );
}
