/** Admin partner detail UI helpers (ADMIN-02D2). */

import type {
  AdminPartnerCapabilities,
  OrganizationType,
  OrganizationVisibility,
  PartnershipType,
  PartnerStatus,
  VerificationStatus,
} from "@yunicity/types";

import { ORGANIZATION_TYPE_OPTIONS, VERIFICATION_STATUS_LABELS } from "./domain-labels";
import { ORGANIZATION_VISIBILITY_LABELS } from "./organization-verification";
import { partnerStatusLabel, partnerTypeLabel } from "./partner-labels";

export function adminPartnerDetailPath(organizationId: string): string {
  return `/partners/organizations/${encodeURIComponent(organizationId)}`;
}

export function partnershipTypeLabel(type: PartnershipType): string {
  return partnerTypeLabel(type);
}

export function visibilityLabel(visibility: OrganizationVisibility): string {
  return ORGANIZATION_VISIBILITY_LABELS[visibility] ?? visibility;
}

export function verificationStatusLabel(status: VerificationStatus): string {
  return VERIFICATION_STATUS_LABELS[status] ?? status;
}

export function organizationTypeLabel(type: OrganizationType): string {
  return ORGANIZATION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function formatPartnerDate(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export type AdminPartnerCapabilityKey = keyof AdminPartnerCapabilities;

const CAPABILITY_LABELS: Record<AdminPartnerCapabilityKey, string> = {
  can_create_profile: "Créer un profil partenaire",
  can_activate: "Activer le partenaire (signed → active)",
  can_pause: "Mettre en pause",
  can_upgrade_premium: "Passer en premium",
};

export function capabilityLabel(key: AdminPartnerCapabilityKey): string {
  return CAPABILITY_LABELS[key];
}
