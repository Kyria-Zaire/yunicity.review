/** Signed partners UI helpers (WEB-PARTNERS-01). */

import type { PartnerPublic, PartnerStatus, PartnershipType } from "@yunicity/types";

const PUBLIC_PARTNER_STATUSES: ReadonlySet<PartnerStatus> = new Set([
  "active",
  "premium",
  "founding_partner",
]);

const STATUS_LABELS: Record<PartnerStatus, string> = {
  signed: "Partenaire signé",
  active: "Partenaire actif",
  paused: "Partenaire en pause",
  premium: "Partenaire premium",
  founding_partner: "Partenaire fondateur",
};

const TYPE_LABELS: Record<PartnershipType, string> = {
  local_business: "Commerce local",
  association: "Association",
  sports_club: "Club sportif",
  restaurant: "Restaurant",
  nightlife: "Nightlife",
  creator_partner: "Créateur partenaire",
  institutional: "Institutionnel",
  internal_project: "Projet interne",
};

export const PARTNERSHIP_TYPE_SELECT_OPTIONS: { value: PartnershipType; label: string }[] = (
  Object.keys(TYPE_LABELS) as PartnershipType[]
).map((value) => ({
  value,
  label: TYPE_LABELS[value],
}));

const CATEGORY_LABELS: Record<string, string> = {
  sport: "Sport",
  services: "Services",
  food: "Food",
  cafe: "Café",
  creator: "Créateur",
  nightlife: "Nightlife",
  fast_food: "Fast food",
  asian_food: "Cuisine asiatique",
  institutional: "Institutionnel",
  barber: "Barbier",
};

export function partnerStatusLabel(status: PartnerStatus): string {
  return STATUS_LABELS[status] ?? "Partenaire";
}

export function partnerTypeLabel(type: PartnershipType): string {
  return TYPE_LABELS[type] ?? "Partenaire local";
}

export function isPublicPartner(status: PartnerStatus): boolean {
  return PUBLIC_PARTNER_STATUSES.has(status);
}

export function partnerDisplayCategory(
  partner: Pick<PartnerPublic, "category"> & { partnership_type?: PartnershipType | null },
): string {
  if (partner.category) {
    return CATEGORY_LABELS[partner.category] ?? partner.category;
  }
  return partner.partnership_type ? partnerTypeLabel(partner.partnership_type) : "Partenaire local";
}

/** Guard for accidental internal field leaks in client code. */
export function assertPartnerPublicShape(value: Record<string, unknown>): void {
  const forbidden = [
    "notes_internal",
    "contract_reference",
    "contact_email",
    "contact_phone",
    "contact_name",
    "signed_at",
  ] as const;
  for (const key of forbidden) {
    if (key in value) {
      throw new Error(`Champ interne exposé côté client: ${key}`);
    }
  }
}
