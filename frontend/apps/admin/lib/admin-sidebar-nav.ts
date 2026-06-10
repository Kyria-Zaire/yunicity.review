export const PARTNER_NAV_LABELS = [
  "Scanner Passport",
  "Mes offres pour la ville",
] as const;

export const STAFF_NAV_LABELS = [
  "Cockpit",
  "Partenaires",
  "Passport Ops",
  "Offres",
  "Événements",
  "Contenus créateurs",
  "Modération",
  "Scanner Passport",
  "Staff",
] as const;

/** Staff sessions use TERRAIN / MODÉRATION entries instead of the partner block. */
export function shouldShowPartnerNavBlock(isStaffUser: boolean): boolean {
  return !isStaffUser;
}

export function getVisibleSidebarNavLabels(isStaffUser: boolean): {
  partner: string[];
  staff: string[];
} {
  return {
    partner: shouldShowPartnerNavBlock(isStaffUser) ? [...PARTNER_NAV_LABELS] : [],
    staff: isStaffUser ? [...STAFF_NAV_LABELS] : [],
  };
}
