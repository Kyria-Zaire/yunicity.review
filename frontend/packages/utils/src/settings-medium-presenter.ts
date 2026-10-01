import {
  SETTINGS_MEDIUM_TAB_GENERAL,
  SETTINGS_MEDIUM_TAB_PREFERENCES,
  SETTINGS_MEDIUM_TAB_PRIVACY,
  SETTINGS_MEDIUM_TAB_PUBLIC_PROFILE,
  SETTINGS_MEDIUM_TAB_SECURITY,
} from "./settings-medium-labels";

export type SettingsMediumTabId =
  | "general"
  | "public-profile"
  | "security"
  | "preferences"
  | "privacy";

export type SettingsMediumTab = {
  id: SettingsMediumTabId;
  label: string;
  href?: string;
  sectionId?: string;
};

export const SETTINGS_MEDIUM_TABS: SettingsMediumTab[] = [
  { id: "general", label: SETTINGS_MEDIUM_TAB_GENERAL, sectionId: "account" },
  {
    id: "public-profile",
    label: SETTINGS_MEDIUM_TAB_PUBLIC_PROFILE,
    href: "/profile/me",
  },
  { id: "security", label: SETTINGS_MEDIUM_TAB_SECURITY, sectionId: "security" },
  {
    id: "preferences",
    label: SETTINGS_MEDIUM_TAB_PREFERENCES,
    sectionId: "city",
  },
  { id: "privacy", label: SETTINGS_MEDIUM_TAB_PRIVACY, sectionId: "privacy" },
];

export function settingsMediumSectionDomId(sectionId: string): string {
  return `settings-medium-${sectionId}`;
}

export function settingsMediumScrollToSection(sectionId: string) {
  if (typeof document === "undefined") return;
  document
    .getElementById(settingsMediumSectionDomId(sectionId))
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
