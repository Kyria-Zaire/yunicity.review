"use client";

import { SettingsDesktopMain } from "@/components/settings/desktop/settings-desktop-main";
import { SettingsDesktopRightRail } from "@/components/settings/desktop/settings-desktop-right-rail";
import { SettingsMediumHeader } from "@/components/settings/medium/settings-medium-header";
import type { AuthUser, ProfileMe, ProfileVisibility, UserNotificationPreferences } from "@yunicity/types";
import type { SettingsAccountStatus, SettingsMediumTabId } from "@yunicity/utils";
import {
  SETTINGS_MEDIUM_SHORTCUT_NOTIFICATIONS,
  settingsMediumScrollToSection,
  settingsMediumSectionDomId,
} from "@yunicity/utils";
import { useState } from "react";

type SettingsMediumScreenProps = {
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

/** Shell Paramètres medium — 640 → 1023 px (MEDIUM-SETTINGS-01). */
export function SettingsMediumScreen({
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
}: SettingsMediumScreenProps) {
  const [activeTabId, setActiveTabId] = useState<SettingsMediumTabId>("general");

  return (
    <div
      className="settings-medium-root mx-auto w-full px-3 py-3 sm:px-4 sm:py-4"
      data-settings-medium=""
    >
      <SettingsMediumHeader activeTabId={activeTabId} onTabChange={setActiveTabId} />

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] md:items-start">
        <SettingsDesktopMain
          variant="medium"
          sectionDomId={settingsMediumSectionDomId}
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

        <SettingsDesktopRightRail
          variant="medium"
          accountStatus={accountStatus}
          sectionDomId={settingsMediumSectionDomId}
          onScrollToSection={settingsMediumScrollToSection}
          notificationsShortcutLabel={SETTINGS_MEDIUM_SHORTCUT_NOTIFICATIONS}
        />
      </div>
    </div>
  );
}
