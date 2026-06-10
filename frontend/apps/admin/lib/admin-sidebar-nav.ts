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

export function isStaffNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  if (href === "/partners") {
    return pathname === "/partners" || pathname.startsWith("/partners/");
  }
  if (href === "/passport-ops") {
    return pathname === "/passport-ops" || pathname.startsWith("/passport-ops/");
  }
  if (href === "/passport-offers") {
    return pathname === "/passport-offers" || pathname.startsWith("/passport-offers/");
  }
  if (href === "/events") {
    return pathname === "/events" || pathname.startsWith("/events/");
  }
  if (href === "/creator-content") {
    return pathname === "/creator-content" || pathname.startsWith("/creator-content/");
  }
  if (href === "/moderation") {
    return pathname === "/moderation" || pathname.startsWith("/moderation/");
  }
  if (href === "/partner-scan") {
    return pathname === "/partner-scan" || pathname.startsWith("/partner-scan/");
  }
  if (href === "/staff") {
    return pathname === "/staff" || pathname.startsWith("/staff/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
