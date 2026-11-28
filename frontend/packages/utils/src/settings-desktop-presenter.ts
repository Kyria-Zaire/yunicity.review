import type { ProfileMe, ProfileVisibility } from "@yunicity/types";

import {
  SETTINGS_DESKTOP_NAV_ACCESSIBILITY,
  SETTINGS_DESKTOP_NAV_ACCOUNT,
  SETTINGS_DESKTOP_NAV_BLOCKED,
  SETTINGS_DESKTOP_NAV_CITY,
  SETTINGS_DESKTOP_NAV_DATA,
  SETTINGS_DESKTOP_NAV_GENERAL,
  SETTINGS_DESKTOP_NAV_HELP,
  SETTINGS_DESKTOP_NAV_NOTIFICATIONS,
  SETTINGS_DESKTOP_NAV_PREFERENCES,
  SETTINGS_DESKTOP_NAV_PRIVACY,
  SETTINGS_DESKTOP_NAV_PUBLIC_PROFILE,
  SETTINGS_DESKTOP_NAV_SECURITY,
  SETTINGS_DESKTOP_NAV_VISIBILITY,
  SETTINGS_DESKTOP_STATUS_NEVER,
  SETTINGS_DESKTOP_STATUS_OFF,
  SETTINGS_DESKTOP_STATUS_ON,
} from "./settings-desktop-labels";

export type SettingsDesktopNavId =
  | "general"
  | "public-profile"
  | "security"
  | "city"
  | "notifications"
  | "accessibility"
  | "visibility"
  | "blocked"
  | "data"
  | "help";

export type SettingsDesktopNavItem = {
  id: SettingsDesktopNavId;
  label: string;
  href?: string;
  sectionId?: string;
  available: boolean;
};

export type SettingsDesktopNavGroup = {
  id: "account" | "preferences" | "privacy";
  label: string;
  items: SettingsDesktopNavItem[];
};

export const SETTINGS_DESKTOP_NAV_GROUPS: SettingsDesktopNavGroup[] = [
  {
    id: "account",
    label: SETTINGS_DESKTOP_NAV_ACCOUNT,
    items: [
      { id: "general", label: SETTINGS_DESKTOP_NAV_GENERAL, sectionId: "account", available: true },
      {
        id: "public-profile",
        label: SETTINGS_DESKTOP_NAV_PUBLIC_PROFILE,
        href: "/profile/me",
        available: true,
      },
      { id: "security", label: SETTINGS_DESKTOP_NAV_SECURITY, sectionId: "security", available: true },
    ],
  },
  {
    id: "preferences",
    label: SETTINGS_DESKTOP_NAV_PREFERENCES,
    items: [
      { id: "city", label: SETTINGS_DESKTOP_NAV_CITY, sectionId: "city", available: true },
      {
        id: "notifications",
        label: SETTINGS_DESKTOP_NAV_NOTIFICATIONS,
        sectionId: "notifications",
        available: true,
      },
      {
        id: "accessibility",
        label: SETTINGS_DESKTOP_NAV_ACCESSIBILITY,
        sectionId: "display",
        available: true,
      },
    ],
  },
  {
    id: "privacy",
    label: SETTINGS_DESKTOP_NAV_PRIVACY,
    items: [
      {
        id: "visibility",
        label: SETTINGS_DESKTOP_NAV_VISIBILITY,
        sectionId: "privacy",
        available: true,
      },
      { id: "blocked", label: SETTINGS_DESKTOP_NAV_BLOCKED, available: false },
      { id: "data", label: SETTINGS_DESKTOP_NAV_DATA, sectionId: "actions", available: true },
    ],
  },
];

export const SETTINGS_DESKTOP_HELP_NAV: SettingsDesktopNavItem = {
  id: "help",
  label: SETTINGS_DESKTOP_NAV_HELP,
  sectionId: "help",
  available: true,
};

export function maskSettingsEmail(email: string | null | undefined): string {
  if (!email?.trim()) return "—";
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}${"•".repeat(Math.min(4, Math.max(1, local.length - 1)))}@${domain}`;
}

export function settingsDesktopUsername(profile: ProfileMe, fallback?: string | null): string {
  const username = profile.username?.trim() || fallback?.trim();
  if (!username) return "@citoyen";
  return username.startsWith("@") ? username : `@${username}`;
}

export function settingsDesktopPrivacySummary(visibility: ProfileVisibility): {
  publicProfile: string;
  neighborhoodVisible: string;
  sharedPosition: string;
} {
  const isPublic = visibility === "public";
  const cityOnly = visibility === "city_only";
  return {
    publicProfile: isPublic ? SETTINGS_DESKTOP_STATUS_ON : SETTINGS_DESKTOP_STATUS_OFF,
    neighborhoodVisible: isPublic || cityOnly ? SETTINGS_DESKTOP_STATUS_ON : SETTINGS_DESKTOP_STATUS_OFF,
    sharedPosition: SETTINGS_DESKTOP_STATUS_NEVER,
  };
}

export function settingsDesktopScrollToSection(sectionId: string) {
  if (typeof document === "undefined") return;
  const node = document.getElementById(`settings-desktop-${sectionId}`);
  node?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Transforme `Windows • Edge` → `Edge sur Windows`. */
export function formatSettingsDesktopSessionLabel(webClientLabel: string): string {
  const parts = webClientLabel
    .split("•")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 2) return `${parts[1]} sur ${parts[0]}`;
  return webClientLabel;
}

export function settingsDesktopSectionDomId(sectionId: string): string {
  return `settings-desktop-${sectionId}`;
}
