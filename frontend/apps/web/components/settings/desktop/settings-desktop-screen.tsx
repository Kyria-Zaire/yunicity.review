"use client";

import { SettingsDesktopHeader } from "@/components/settings/desktop/settings-desktop-header";
import { SettingsDesktopLeftRail } from "@/components/settings/desktop/settings-desktop-left-rail";
import { SettingsDesktopMain } from "@/components/settings/desktop/settings-desktop-main";
import { SettingsDesktopRightRail } from "@/components/settings/desktop/settings-desktop-right-rail";
import type { AuthUser, ProfileMe, ProfileVisibility, UserNotificationPreferences } from "@yunicity/types";
import type { SettingsAccountStatus, SettingsDesktopNavId } from "@yunicity/utils";
import { useState } from "react";

type SettingsDesktopScreenProps = {
  user: AuthUser | null;
  profile: ProfileMe;
  displayName: string;
  preferences: UserNotificationPreferences | null;
  accountStatus: SettingsAccountStatus | null;
  isSavingProfile: boolean;
  isSavingPrefs: boolean;
  onSaveProfile: (payload: {
    visibility?: ProfileVisibility;
    preferred_language?: string | null;
    city?: string | null;
  }) => Promise<ProfileMe>;
  onPreferenceChange: (key: keyof UserNotificationPreferences, value: boolean) => void;
  onLogout: () => void;
};

export function SettingsDesktopScreen({
  user,
  profile,
  displayName,
  preferences,
  accountStatus,
  isSavingProfile,
  isSavingPrefs,
  onSaveProfile,
  onPreferenceChange,
  onLogout,
}: SettingsDesktopScreenProps) {
  const [activeNavId, setActiveNavId] = useState<SettingsDesktopNavId>("general");

  return (
    <div className="settings-desktop-root mx-auto w-full px-4 py-4 lg:px-6 lg:py-6" data-settings-desktop="">
      <SettingsDesktopHeader />

      <div className="grid gap-6 lg:grid-cols-[minmax(220px,16rem)_minmax(0,1fr)_minmax(260px,18rem)] lg:items-start">
        <SettingsDesktopLeftRail
          profile={profile}
          displayName={displayName}
          activeNavId={activeNavId}
          onNavChange={setActiveNavId}
        />

        <SettingsDesktopMain
          user={user}
          profile={profile}
          displayName={displayName}
          preferences={preferences}
          isSavingProfile={isSavingProfile}
          isSavingPrefs={isSavingPrefs}
          onSaveProfile={onSaveProfile}
          onPreferenceChange={onPreferenceChange}
          onLogout={onLogout}
        />

        <SettingsDesktopRightRail accountStatus={accountStatus} />
      </div>
    </div>
  );
}
