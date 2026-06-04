/** Admin passport ops UI helpers (ADMIN-03C). */

import type {
  AdminPassportSearchMode,
  AdminPassportStatus,
  PassportTierCode,
} from "@yunicity/types";

import { PASSPORT_TIER_LABELS } from "./passport-level-labels";

export const DEFAULT_PASSPORT_OPS_CITY = "Reims";

export const ADMIN_PASSPORT_STATUS_LABELS: Record<AdminPassportStatus, string> = {
  active: "Actif",
  suspended: "Suspendu",
};

export const ADMIN_PASSPORT_SEARCH_MODE_LABELS: Record<AdminPassportSearchMode, string> = {
  email: "Email",
  passport_number: "Numéro Passport",
  display_name: "Nom affiché",
  qr_fragment: "Fragment QR",
};

export const ADMIN_PASSPORT_SEARCH_MODE_AUTO = "auto" as const;

export type AdminPassportSearchModeOption =
  | typeof ADMIN_PASSPORT_SEARCH_MODE_AUTO
  | AdminPassportSearchMode;

export const ADMIN_PASSPORT_SEARCH_MODE_OPTIONS: {
  value: AdminPassportSearchModeOption;
  label: string;
}[] = [
  { value: ADMIN_PASSPORT_SEARCH_MODE_AUTO, label: "Automatique" },
  ...(
    Object.entries(ADMIN_PASSPORT_SEARCH_MODE_LABELS) as [AdminPassportSearchMode, string][]
  ).map(([value, label]) => ({ value, label })),
];

export function adminPassportStatusLabel(status: AdminPassportStatus): string {
  return ADMIN_PASSPORT_STATUS_LABELS[status] ?? status;
}

export function adminPassportSearchModeLabel(mode: AdminPassportSearchModeOption): string {
  if (mode === ADMIN_PASSPORT_SEARCH_MODE_AUTO) {
    return "Automatique";
  }
  return ADMIN_PASSPORT_SEARCH_MODE_LABELS[mode] ?? mode;
}

export function adminPassportTierLabel(code: PassportTierCode): string {
  return PASSPORT_TIER_LABELS[code] ?? code;
}

export function buildPassportOpsDetailPath(passportId: string): string {
  return `/passport-ops/${encodeURIComponent(passportId)}`;
}

export function buildPassportOpsListPath(query?: Record<string, string | undefined>): string {
  if (!query) {
    return "/passport-ops";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value?.trim()) {
      search.set(key, value.trim());
    }
  }
  const qs = search.toString();
  return qs ? `/passport-ops?${qs}` : "/passport-ops";
}
