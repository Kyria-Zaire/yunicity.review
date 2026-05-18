import type { OrganizationMeItem } from "@yunicity/types";

const OFFER_MANAGER_ROLES = new Set(["owner", "admin"]);

export function canManagePartnerOffers(org: OrganizationMeItem): boolean {
  return (
    org.member_status === "active" &&
    OFFER_MANAGER_ROLES.has(org.member_role) &&
    org.verification_status === "verified"
  );
}

export function listOfferManageableOrganizations(
  items: OrganizationMeItem[],
): OrganizationMeItem[] {
  return items.filter(canManagePartnerOffers);
}

export function hasOfferManagerRole(org: OrganizationMeItem): boolean {
  return org.member_status === "active" && OFFER_MANAGER_ROLES.has(org.member_role);
}
