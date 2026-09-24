"use client";

import { SettingsMobileAccountCard } from "@/components/settings/mobile/settings-mobile-account-card";
import { SettingsMobileCategoryPicker } from "@/components/settings/mobile/settings-mobile-category-picker";
import { SettingsMobileHeader } from "@/components/settings/mobile/settings-mobile-header";
import { SettingsMobileHub } from "@/components/settings/mobile/settings-mobile-hub";
import { SettingsMobileSectionHeader } from "@/components/settings/mobile/settings-mobile-section-header";
import { SettingsSections } from "@/components/settings/settings-sections";
import type { AuthUser, ProfileMe, PushSubscription, UserNotificationPreferences } from "@yunicity/types";
import type {
  SettingsAccountStatus,
  SettingsHubGroup,
  SettingsMobileCategoryId,
  SettingsSectionId,
  SettingsVerificationView,
} from "@yunicity/utils";
import {
  SETTINGS_ABOUT_TITLE,
  SETTINGS_DELETE_TITLE,
  SETTINGS_DEVICES_TITLE,
  SETTINGS_DISPLAY_TITLE,
  SETTINGS_EXPORT_TITLE,
  SETTINGS_HELP_TITLE,
  SETTINGS_MOBILE_SUBTITLE,
  SETTINGS_PERSONAL_TITLE,
  SETTINGS_PERSONALIZATION_TITLE,
  SETTINGS_PRIVACY_TITLE,
  SETTINGS_SECURITY_TITLE,
  SETTINGS_VERIFICATION_TITLE,
} from "@yunicity/utils";
import { useMemo, useState, type ComponentProps } from "react";

type SettingsSectionsProps = ComponentProps<typeof SettingsSections>;

const SECTION_LABELS: Record<SettingsSectionId, string> = {
  personal: SETTINGS_PERSONAL_TITLE,
  security: SETTINGS_SECURITY_TITLE,
  verification: SETTINGS_VERIFICATION_TITLE,
  notifications: "Notifications",
  display: SETTINGS_DISPLAY_TITLE,
  privacy: SETTINGS_PRIVACY_TITLE,
  personalization: SETTINGS_PERSONALIZATION_TITLE,
  help: SETTINGS_HELP_TITLE,
  about: SETTINGS_ABOUT_TITLE,
  devices: SETTINGS_DEVICES_TITLE,
  export: SETTINGS_EXPORT_TITLE,
  delete: SETTINGS_DELETE_TITLE,
};

type SettingsMobileViewProps = {
  user: AuthUser | null;
  profile: ProfileMe;
  preferences: UserNotificationPreferences | null;
  pushDevices: PushSubscription[];
  hubGroups: SettingsHubGroup[];
  displayName: string;
  verification: SettingsVerificationView;
  accountStatus: SettingsAccountStatus | null;
  isSavingProfile: boolean;
  isSavingPrefs: boolean;
  removingDeviceId: string | null;
  onSaveProfile: SettingsSectionsProps["onSaveProfile"];
  onPreferenceChange: SettingsSectionsProps["onPreferenceChange"];
  onRemoveDevice: SettingsSectionsProps["onRemoveDevice"];
  onLogout: () => void;
};

/** Vue mobile Paramètres (MOBILE-SETTINGS-02). */
export function SettingsMobileView({
  user,
  profile,
  preferences,
  pushDevices,
  hubGroups: _hubGroups,
  displayName,
  verification,
  accountStatus,
  isSavingProfile,
  isSavingPrefs,
  removingDeviceId,
  onSaveProfile,
  onPreferenceChange,
  onRemoveDevice,
  onLogout,
}: SettingsMobileViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSectionId | null>(null);
  const [activeCategoryId, setActiveCategoryId] =
    useState<SettingsMobileCategoryId>("general");

  const sectionTitle = useMemo(
    () => (activeSection ? SECTION_LABELS[activeSection] : SETTINGS_MOBILE_SUBTITLE),
    [activeSection],
  );

  if (activeSection) {
    return (
      <div className="web-mobile-settings-only min-w-0 bg-[#F4F5F7] pb-24">
        <SettingsMobileSectionHeader
          title={sectionTitle}
          onBack={() => setActiveSection(null)}
        />

        <div className="px-4 pt-4">
          <SettingsSections
            user={user}
            profile={profile}
            preferences={preferences}
            pushDevices={pushDevices}
            verification={verification}
            isSavingProfile={isSavingProfile}
            isSavingPrefs={isSavingPrefs}
            removingDeviceId={removingDeviceId}
            visibleSectionId={activeSection}
            variant="mobile"
            onSaveProfile={onSaveProfile}
            onPreferenceChange={onPreferenceChange}
            onRemoveDevice={onRemoveDevice}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="web-mobile-settings-only min-w-0 bg-[#F4F5F7] pb-24">
      <SettingsMobileHeader />

      <div className="space-y-3 px-4 pt-3">
        <p className="text-sm leading-relaxed text-neutral-500">{SETTINGS_MOBILE_SUBTITLE}</p>

        <SettingsMobileAccountCard profile={profile} displayName={displayName} />

        <SettingsMobileCategoryPicker
          activeCategoryId={activeCategoryId}
          onCategoryChange={setActiveCategoryId}
        />

        <SettingsMobileHub
          user={user}
          profile={profile}
          preferences={preferences}
          accountStatus={accountStatus}
          isSavingPrefs={isSavingPrefs}
          onNavigate={setActiveSection}
          onPreferenceChange={onPreferenceChange}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
}
