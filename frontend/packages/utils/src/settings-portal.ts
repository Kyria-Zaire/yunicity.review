import type { AuthUser, ProfileMe, PushSubscription } from "@yunicity/types";

import {
  SETTINGS_GROUP_ACCOUNT,
  SETTINGS_GROUP_OTHER,
  SETTINGS_GROUP_PREFERENCES,
  SETTINGS_ONBOARDING_DONE,
  SETTINGS_ONBOARDING_PENDING,
  SETTINGS_ROW_ABOUT,
  SETTINGS_ROW_ABOUT_DESC,
  SETTINGS_ROW_DISPLAY,
  SETTINGS_ROW_DISPLAY_DESC,
  SETTINGS_ROW_HELP,
  SETTINGS_ROW_HELP_DESC,
  SETTINGS_ROW_NOTIFICATIONS,
  SETTINGS_ROW_NOTIFICATIONS_DESC,
  SETTINGS_ROW_PERSONAL,
  SETTINGS_ROW_PERSONAL_DESC,
  SETTINGS_ROW_PERSONALIZATION,
  SETTINGS_ROW_PERSONALIZATION_DESC,
  SETTINGS_ROW_PRIVACY,
  SETTINGS_ROW_PRIVACY_DESC,
  SETTINGS_ROW_SECURITY,
  SETTINGS_ROW_SECURITY_DESC,
  SETTINGS_ROW_VERIFICATION,
  SETTINGS_ROW_VERIFICATION_DESC,
  SETTINGS_SOON,
  SETTINGS_UNVERIFIED,
  SETTINGS_VERIFIED,
} from "./settings-portal-labels";

export type SettingsSectionId =
  | "personal"
  | "security"
  | "verification"
  | "notifications"
  | "display"
  | "privacy"
  | "personalization"
  | "help"
  | "about"
  | "devices"
  | "export"
  | "delete";

export type SettingsGroupId = "account" | "preferences" | "other";

export type SettingsHubRow = {
  id: SettingsSectionId;
  label: string;
  description: string;
  iconTone: SettingsIconTone;
  available: boolean;
  soonLabel?: string;
};

export type SettingsIconTone =
  | "violet"
  | "blue"
  | "green"
  | "pink"
  | "orange"
  | "sky"
  | "teal"
  | "indigo"
  | "slate"
  | "red";

export type SettingsHubGroup = {
  id: SettingsGroupId;
  label: string;
  rows: SettingsHubRow[];
};

export type SettingsAccountStatus = {
  memberSinceLabel: string;
  lastUpdateLabel: string;
  currentDeviceLabel: string;
  pushDeviceCount: number;
};

export type SettingsVerificationView = {
  verified: boolean;
  verifiedLabel: string;
  onboardingCompleted: boolean;
  onboardingLabel: string;
};

const ICON_TONE_CLASS: Record<SettingsIconTone, string> = {
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  pink: "bg-pink-100 text-pink-700",
  orange: "bg-orange-100 text-orange-700",
  sky: "bg-sky-100 text-sky-700",
  teal: "bg-teal-100 text-teal-700",
  indigo: "bg-indigo-100 text-indigo-700",
  slate: "bg-slate-100 text-slate-700",
  red: "bg-red-50 text-red-600",
};

export function settingsIconToneClass(tone: SettingsIconTone): string {
  return ICON_TONE_CLASS[tone];
}

export function formatSettingsDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatSettingsDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  if (isToday) {
    return `Aujourd'hui, ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Détection navigateur côté client — pas de données serveur inventées. */
export function detectWebClientLabel(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  let browser = "Navigateur";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome/") && !ua.includes("edg/")) browser = "Chrome";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("safari/") && !ua.includes("chrome/")) browser = "Safari";

  let os = "Web";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os")) os = "macOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("linux")) os = "Linux";

  return `${os} • ${browser}`;
}

export function buildSettingsDisplayName(
  profile: ProfileMe | null,
  user: AuthUser | null,
): string {
  const fromProfile = profile?.display_name?.trim();
  if (fromProfile) return fromProfile;
  const fromUser = user?.full_name?.trim();
  if (fromUser) return fromUser;
  return profile?.username ?? user?.email?.split("@")[0] ?? "Citoyen";
}

export function buildSettingsVerificationView(
  user: AuthUser | null,
  profile: ProfileMe | null,
): SettingsVerificationView {
  const verified = Boolean(user?.is_verified);
  const onboardingCompleted = Boolean(profile?.onboarding_completed);
  return {
    verified,
    verifiedLabel: verified ? SETTINGS_VERIFIED : SETTINGS_UNVERIFIED,
    onboardingCompleted,
    onboardingLabel: onboardingCompleted ? SETTINGS_ONBOARDING_DONE : SETTINGS_ONBOARDING_PENDING,
  };
}

export function buildSettingsAccountStatus(
  user: AuthUser | null,
  pushDevices: PushSubscription[],
  webClientLabel: string,
): SettingsAccountStatus | null {
  if (!user) return null;
  return {
    memberSinceLabel: formatSettingsDate(user.created_at),
    lastUpdateLabel: formatSettingsDateTime(user.updated_at),
    currentDeviceLabel: webClientLabel,
    pushDeviceCount: pushDevices.filter((device) => device.is_active).length,
  };
}

export function buildSettingsHubGroups(): SettingsHubGroup[] {
  return [
    {
      id: "account",
      label: SETTINGS_GROUP_ACCOUNT,
      rows: [
        {
          id: "personal",
          label: SETTINGS_ROW_PERSONAL,
          description: SETTINGS_ROW_PERSONAL_DESC,
          iconTone: "violet",
          available: true,
        },
        {
          id: "security",
          label: SETTINGS_ROW_SECURITY,
          description: SETTINGS_ROW_SECURITY_DESC,
          iconTone: "blue",
          available: false,
          soonLabel: SETTINGS_SOON,
        },
        {
          id: "verification",
          label: SETTINGS_ROW_VERIFICATION,
          description: SETTINGS_ROW_VERIFICATION_DESC,
          iconTone: "green",
          available: true,
        },
      ],
    },
    {
      id: "preferences",
      label: SETTINGS_GROUP_PREFERENCES,
      rows: [
        {
          id: "notifications",
          label: SETTINGS_ROW_NOTIFICATIONS,
          description: SETTINGS_ROW_NOTIFICATIONS_DESC,
          iconTone: "pink",
          available: true,
        },
        {
          id: "display",
          label: SETTINGS_ROW_DISPLAY,
          description: SETTINGS_ROW_DISPLAY_DESC,
          iconTone: "orange",
          available: true,
        },
        {
          id: "privacy",
          label: SETTINGS_ROW_PRIVACY,
          description: SETTINGS_ROW_PRIVACY_DESC,
          iconTone: "sky",
          available: true,
        },
        {
          id: "personalization",
          label: SETTINGS_ROW_PERSONALIZATION,
          description: SETTINGS_ROW_PERSONALIZATION_DESC,
          iconTone: "teal",
          available: true,
        },
      ],
    },
    {
      id: "other",
      label: SETTINGS_GROUP_OTHER,
      rows: [
        {
          id: "help",
          label: SETTINGS_ROW_HELP,
          description: SETTINGS_ROW_HELP_DESC,
          iconTone: "indigo",
          available: true,
        },
        {
          id: "about",
          label: SETTINGS_ROW_ABOUT,
          description: SETTINGS_ROW_ABOUT_DESC,
          iconTone: "slate",
          available: true,
        },
      ],
    },
  ];
}

export function settingsSectionDomId(sectionId: SettingsSectionId): string {
  return `settings-${sectionId}`;
}

export const SETTINGS_LANGUAGE_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
] as const;

export function formatPushDeviceLabel(device: PushSubscription): string {
  const name = device.device_name?.trim();
  const platform = device.platform === "ios" ? "iOS" : "Android";
  if (name) return `${name} • ${platform}`;
  return platform;
}
