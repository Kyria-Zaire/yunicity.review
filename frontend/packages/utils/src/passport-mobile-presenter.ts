import type { PartnerOfferPublic, PassportStamp } from "@yunicity/types";

import { PASSPORT_JOURNEY_LEVELS, type PassportLevelView } from "./passport-dashboard";
import { PASSPORT_MOBILE_MEMBER_SINCE_PREFIX } from "./passport-mobile-labels";
import { isPartnerOfferActive } from "./partner-offer-public";

/** Index 1-based du palier parcours (ex. Habitant → 1). */
export function resolvePassportMobileLevelNumber(levelView: PassportLevelView): number {
  const index = PASSPORT_JOURNEY_LEVELS.findIndex((level) => level.id === levelView.level.id);
  return index >= 0 ? index + 1 : 1;
}

export function formatPassportMobileMemberSince(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
  return `${PASSPORT_MOBILE_MEMBER_SINCE_PREFIX} ${formatted}`;
}

function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

/** Date relative courte pour l'activité Passport mobile. */
export function formatPassportMobileActivityDate(stampedAt: string, now = new Date()): string {
  const date = new Date(stampedAt);
  if (Number.isNaN(date.getTime())) return "—";

  if (isSameCalendarDay(date, now)) return "Aujourd'hui";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameCalendarDay(date, yesterday)) return "Hier";

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Libellé « Valable X j » pour le carrousel mobile. */
export function formatPartnerOfferDaysRemainingLabel(
  offer: Pick<PartnerOfferPublic, "valid_from" | "valid_until">,
  now = new Date(),
): string | null {
  if (!isPartnerOfferActive(offer, now)) return null;
  if (!offer.valid_until) return null;

  const end = new Date(offer.valid_until);
  if (Number.isNaN(end.getTime())) return null;

  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `Valable ${days} j`;
}

const OFFER_CATEGORY_TONES = [
  "bg-violet-100 text-violet-700",
  "bg-pink-100 text-pink-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-800",
] as const;

export function resolvePartnerOfferCategoryTone(category: string | null | undefined): string {
  const key = category?.trim().toLowerCase() ?? "";
  if (!key) return OFFER_CATEGORY_TONES[0];
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash + key.charCodeAt(index) * (index + 1)) % OFFER_CATEGORY_TONES.length;
  }
  return OFFER_CATEGORY_TONES[hash] ?? OFFER_CATEGORY_TONES[0];
}

export function buildPassportMobileActivityRows(
  stamps: PassportStamp[],
  limit = 5,
): PassportStamp[] {
  return [...stamps]
    .sort(
      (left, right) =>
        new Date(right.stamped_at).getTime() - new Date(left.stamped_at).getTime(),
    )
    .slice(0, limit);
}
