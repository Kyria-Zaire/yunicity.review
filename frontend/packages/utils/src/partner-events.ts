import type { LocalEvent, LocalEventOrganization, PartnerStatus } from "@yunicity/types";
import { buildPublicPlaceHref } from "./place-routing";

const PUBLIC_PARTNER_STATUSES: ReadonlySet<PartnerStatus> = new Set([
  "active",
  "premium",
  "founding_partner",
]);

export function eventIsPartnerEvent(event: LocalEvent): boolean {
  const org = event.organization;
  if (!org?.is_partner) return false;
  const status = org.partner_status;
  return status != null && PUBLIC_PARTNER_STATUSES.has(status);
}

export function eventOrganizerLabel(event: LocalEvent): string {
  if (event.organization?.name) {
    return event.organization.name;
  }
  return "Événement local";
}

export function eventPartnerBadgeLabel(event: LocalEvent): string | null {
  if (!eventIsPartnerEvent(event)) {
    return null;
  }
  const status = event.organization?.partner_status;
  if (status === "premium") return "Partenaire Premium";
  if (status === "founding_partner") return "Partenaire Fondateur";
  return "Partenaire";
}

export function buildPartnerEventsUrl(slug: string, city?: string): string {
  const base = `/partners/${encodeURIComponent(slug)}/events`;
  if (!city) return base;
  return `${base}?city=${encodeURIComponent(city)}`;
}

export function getPartnerEventOrganization(
  event: LocalEvent,
): LocalEventOrganization | null {
  if (!eventIsPartnerEvent(event)) return null;
  return event.organization ?? null;
}

export function buildPartnerPlaceHrefFromEvent(event: LocalEvent): string | null {
  const org = getPartnerEventOrganization(event);
  if (!org) return null;
  return buildPublicPlaceHref(org.slug, org.city);
}
