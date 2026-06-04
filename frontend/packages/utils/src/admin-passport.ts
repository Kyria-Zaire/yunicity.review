/** Admin passport ops UI helpers (ADMIN-03C). */

import type {
  AdminPassportActionKind,
  AdminPassportSearchMode,
  AdminPassportStatus,
  OfferRedemptionStatus,
  PassportTierCode,
} from "@yunicity/types";

import { adminPartnerDetailPath } from "./admin-partner";
import { PASSPORT_TIER_LABELS } from "./passport-level-labels";

export const DEFAULT_PASSPORT_OPS_CITY = "Reims";

export const ADMIN_PASSPORT_REASON_MIN_LENGTH = 3;
export const ADMIN_PASSPORT_REASON_MAX_LENGTH = 1000;

export type PassportStatusActionKind = "suspend" | "reactivate";

const PASSPORT_STATUS_ACTION_COPY: Record<
  PassportStatusActionKind,
  { title: string; description: string; confirmLabel: string; confirmTone: "danger" | "primary" }
> = {
  suspend: {
    title: "Suspendre ce Passport",
    description:
      "Le scan et les redemptions seront bloqués tant que le Passport est suspendu.",
    confirmLabel: "Suspendre",
    confirmTone: "danger",
  },
  reactivate: {
    title: "Réactiver ce Passport",
    description: "Le Passport pourra de nouveau être utilisé.",
    confirmLabel: "Réactiver",
    confirmTone: "primary",
  },
};

export function canSuspendPassport(status: AdminPassportStatus): boolean {
  return status === "active";
}

export function canReactivatePassport(status: AdminPassportStatus): boolean {
  return status === "suspended";
}

export function canModifyPassportStatus(status: AdminPassportStatus): boolean {
  return canSuspendPassport(status) || canReactivatePassport(status);
}

export function passportStatusActionKind(
  status: AdminPassportStatus,
): PassportStatusActionKind | null {
  if (canSuspendPassport(status)) {
    return "suspend";
  }
  if (canReactivatePassport(status)) {
    return "reactivate";
  }
  return null;
}

export function passportStatusActionCopy(kind: PassportStatusActionKind) {
  return PASSPORT_STATUS_ACTION_COPY[kind];
}

export function isPassportReasonValid(reason: string): boolean {
  const trimmed = reason.trim();
  return (
    trimmed.length >= ADMIN_PASSPORT_REASON_MIN_LENGTH &&
    trimmed.length <= ADMIN_PASSPORT_REASON_MAX_LENGTH
  );
}

export function passportStatusActionSuccessMessage(kind: PassportStatusActionKind): string {
  return kind === "suspend"
    ? "Passport suspendu. Le scan terrain est bloqué jusqu’à réactivation."
    : "Passport réactivé. Le citoyen peut à nouveau utiliser son Passport.";
}

export const ADMIN_PASSPORT_ACTION_LABELS: Record<AdminPassportActionKind, string> = {
  suspend: "Suspension",
  reactivate: "Réactivation",
};

export function adminPassportActionLabel(action: AdminPassportActionKind): string {
  return ADMIN_PASSPORT_ACTION_LABELS[action] ?? action;
}

export const ADMIN_PASSPORT_STATUS_LABELS: Record<AdminPassportStatus, string> = {
  active: "Actif",
  suspended: "Suspendu",
};

function staffDbStatusLabel(status: string | null | undefined): string {
  if (status === "active") {
    return ADMIN_PASSPORT_STATUS_LABELS.active;
  }
  if (status === "suspended") {
    return ADMIN_PASSPORT_STATUS_LABELS.suspended;
  }
  if (status === "revoked") {
    return "Révoqué";
  }
  return status ?? "—";
}

export function formatAdminPassportActionStatusTransition(
  previousStatus: string | null,
  newStatus: string | null,
): string {
  return `${staffDbStatusLabel(previousStatus)} → ${staffDbStatusLabel(newStatus)}`;
}

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

export const OFFER_REDEMPTION_STATUS_LABELS: Record<OfferRedemptionStatus, string> = {
  pending: "En attente",
  completed: "Validée",
  cancelled: "Annulée",
  failed: "Échouée",
};

export function offerRedemptionStatusLabel(status: OfferRedemptionStatus): string {
  return OFFER_REDEMPTION_STATUS_LABELS[status] ?? status;
}

export function maskStaffQrToken(token: string, revealed: boolean): string {
  if (revealed || token.length <= 16) {
    return token;
  }
  const head = token.slice(0, 8);
  const tail = token.slice(-4);
  return `${head}…${tail}`;
}

export function buildPassportOpsDetailPath(passportId: string): string {
  return `/passport-ops/${encodeURIComponent(passportId)}`;
}

/** Alias workspace liste (ADMIN-03C). */
export function buildPassportOpsPath(query?: Record<string, string | undefined>): string {
  return buildPassportOpsListPath(query);
}

export function buildPartnerDetailPath(organizationId: string): string {
  return adminPartnerDetailPath(organizationId);
}

export function buildPassportOfferAdminPath(offerId: string): string {
  return `/passport-offers/${encodeURIComponent(offerId)}`;
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
