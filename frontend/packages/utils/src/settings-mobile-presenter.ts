import {
  SETTINGS_MOBILE_CATEGORY_GENERAL,
  SETTINGS_MOBILE_CATEGORY_PREFERENCES,
  SETTINGS_MOBILE_CATEGORY_PRIVACY,
  SETTINGS_MOBILE_CATEGORY_PUBLIC,
  SETTINGS_MOBILE_CATEGORY_SECURITY,
  SETTINGS_MOBILE_SESSIONS,
} from "./settings-mobile-labels";

export type SettingsMobileCategoryId =
  | "general"
  | "public-profile"
  | "security"
  | "preferences"
  | "privacy";

export type SettingsMobileCategory = {
  id: SettingsMobileCategoryId;
  label: string;
  href?: string;
  sectionId?: string;
};

export const SETTINGS_MOBILE_CATEGORIES: SettingsMobileCategory[] = [
  { id: "general", label: SETTINGS_MOBILE_CATEGORY_GENERAL, sectionId: "account" },
  {
    id: "public-profile",
    label: SETTINGS_MOBILE_CATEGORY_PUBLIC,
    href: "/profile/me",
  },
  { id: "security", label: SETTINGS_MOBILE_CATEGORY_SECURITY, sectionId: "security" },
  {
    id: "preferences",
    label: SETTINGS_MOBILE_CATEGORY_PREFERENCES,
    sectionId: "city",
  },
  {
    id: "privacy",
    label: SETTINGS_MOBILE_CATEGORY_PRIVACY,
    sectionId: "privacy",
  },
];

export function settingsMobileSectionDomId(sectionId: string): string {
  return `settings-mobile-${sectionId}`;
}

export function settingsMobileScrollToSection(sectionId: string) {
  if (typeof document === "undefined") return;
  document
    .getElementById(settingsMobileSectionDomId(sectionId))
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function settingsMobileSessionsLabel(activeCount: number): string {
  return `${SETTINGS_MOBILE_SESSIONS} · ${activeCount}`;
}
