/** Local passport stamp micro-copy (TICKET-504). */

import type { PassportStamp } from "@yunicity/types";

export const PASSPORT_STAMPS_SECTION_TITLE = "Tampons locaux";

export const PASSPORT_STAMPS_EMPTY =
  "Vos passages et découvertes locales apparaîtront ici, comme dans un carnet de voyage.";

export function formatStampDisplayLine(stamp: PassportStamp): string {
  if (stamp.kind === "memory" && stamp.human_line) {
    return stamp.human_line;
  }
  if (stamp.organization?.name) {
    const city = stamp.organization.city || stamp.city || "";
    return city
      ? `${stamp.organization.name} · ${city}`
      : stamp.organization.name;
  }
  if (stamp.title) {
    return stamp.city ? `${stamp.title} · ${stamp.city}` : stamp.title;
  }
  return "Souvenir local";
}

export function formatStampSubtitle(stamp: PassportStamp): string {
  if (stamp.kind === "memory" && stamp.title && stamp.human_line !== stamp.title) {
    return stamp.title;
  }
  return stamp.description ?? "";
}
