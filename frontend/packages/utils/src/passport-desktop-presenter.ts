import type { PartnerOfferPublic, PassportStamp } from "@yunicity/types";

import {
  PASSPORT_JOURNEY_LEVELS,
  type PassportLevelView,
} from "./passport-dashboard";
import type { PartnerPublic } from "@yunicity/types";

import {
  PASSPORT_DESKTOP_NEXT_STEPS,
  PASSPORT_DESKTOP_CATEGORY_CULTURE,
  PASSPORT_DESKTOP_CATEGORY_FOOD,
  PASSPORT_DESKTOP_CATEGORY_LEISURE,
  PASSPORT_DESKTOP_CATEGORY_SHOPS,
  PASSPORT_DESKTOP_CATEGORY_WELLNESS,
  PASSPORT_DESKTOP_OFFERS_AVAILABLE,
  PASSPORT_DESKTOP_OFFERS_AVAILABLE_UNTIL,
  PASSPORT_DESKTOP_OFFERS_FLASH,
  PASSPORT_DESKTOP_PARTNERS_LOCATION,
  PASSPORT_OFFER_DETAIL_CONDITION_ACTIVE,
  PASSPORT_OFFER_DETAIL_DEFAULT_ABOUT,
  PASSPORT_OFFER_DETAIL_USAGE_ON_SITE,
} from "./passport-desktop-labels";
import { isPartnerOfferActive } from "./partner-offer-public";
import {
  formatPassportMobileActivityDate,
  resolvePassportMobileLevelNumber,
} from "./passport-mobile-presenter";

export type PassportDesktopSegmentProgress = {
  completed: number;
  total: number;
  remaining: number;
  segmentLabel: string;
};

export type PassportDesktopNextStep = {
  id: (typeof PASSPORT_DESKTOP_NEXT_STEPS)[number]["id"];
  title: string;
  category: string;
  href: string;
  tone: "blue" | "green" | "orange";
  done: boolean;
};

export type PassportDesktopActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  tone: "blue" | "green" | "orange";
};

const JOURNEY_TOTAL = PASSPORT_JOURNEY_LEVELS.length;

export function buildPassportDesktopSegmentProgress(
  levelView: PassportLevelView,
): PassportDesktopSegmentProgress {
  const completed = Math.min(JOURNEY_TOTAL, resolvePassportMobileLevelNumber(levelView));
  const remaining = Math.max(0, JOURNEY_TOTAL - completed);
  return {
    completed,
    total: JOURNEY_TOTAL,
    remaining,
    segmentLabel: `${completed} étapes sur ${JOURNEY_TOTAL}`,
  };
}

export function buildPassportDesktopNextSteps(input: {
  stampsCount: number;
  savedEventsCount: number;
  redemptionsCount: number;
}): PassportDesktopNextStep[] {
  const doneById: Record<string, boolean> = {
    discover_place: input.stampsCount > 0,
    join_event: input.savedEventsCount > 0,
    use_offer: input.redemptionsCount > 0,
  };

  return PASSPORT_DESKTOP_NEXT_STEPS.map((step) => ({
    ...step,
    done: doneById[step.id] ?? false,
  }));
}

function resolveActivityTone(index: number): PassportDesktopActivityItem["tone"] {
  if (index % 3 === 1) return "green";
  if (index % 3 === 2) return "orange";
  return "blue";
}

function resolveActivityTitle(stamp: PassportStamp, index: number): string {
  if (stamp.human_line?.trim()) return stamp.human_line.trim();
  if (stamp.kind === "memory") return "Souvenir enregistré";
  if (index % 3 === 1) return "Participation enregistrée";
  if (index % 3 === 2) return "Avantage utilisé";
  return "Lieu partenaire découvert";
}

export function buildPassportDesktopActivityItems(
  stamps: PassportStamp[],
  limit = 3,
): PassportDesktopActivityItem[] {
  return [...stamps]
    .sort(
      (left, right) =>
        new Date(right.stamped_at).getTime() - new Date(left.stamped_at).getTime(),
    )
    .slice(0, limit)
    .map((stamp, index) => ({
      id: stamp.id,
      title: resolveActivityTitle(stamp, index),
      subtitle:
        stamp.organization?.name?.trim() ||
        stamp.title?.trim() ||
        stamp.description?.trim() ||
        "Passage enregistré",
      dateLabel: formatPassportMobileActivityDate(stamp.stamped_at),
      tone: resolveActivityTone(index),
    }));
}

export function buildPassportDesktopSavedOfferPreview(
  offers: PartnerOfferPublic[],
  limit = 2,
): PartnerOfferPublic[] {
  return offers.slice(0, limit);
}

export function isPartnerOfferFlash(
  offer: Pick<PartnerOfferPublic, "valid_from" | "valid_until">,
  now = new Date(),
): boolean {
  if (!isPartnerOfferActive(offer, now) || !offer.valid_until) return false;
  const end = new Date(offer.valid_until);
  if (Number.isNaN(end.getTime())) return false;
  const diffMs = end.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days > 0 && days <= 7;
}

export function partnerOfferFlashLabel(
  offer: Pick<PartnerOfferPublic, "title" | "value_label" | "valid_from" | "valid_until">,
): string | null {
  if (isPartnerOfferFlash(offer)) return PASSPORT_DESKTOP_OFFERS_FLASH;
  const text = `${offer.title} ${offer.value_label ?? ""}`.toLowerCase();
  return text.includes("flash") ? PASSPORT_DESKTOP_OFFERS_FLASH : null;
}

export function formatPassportDesktopOfferAvailability(
  offer: Pick<PartnerOfferPublic, "valid_from" | "valid_until">,
  now = new Date(),
): string {
  if (!offer.valid_until) return PASSPORT_DESKTOP_OFFERS_AVAILABLE;

  const end = new Date(offer.valid_until);
  if (Number.isNaN(end.getTime())) return PASSPORT_DESKTOP_OFFERS_AVAILABLE;

  if (isPartnerOfferFlash(offer, now)) {
    const dateLabel = end.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    const timeLabel = end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return PASSPORT_DESKTOP_OFFERS_AVAILABLE_UNTIL(dateLabel, timeLabel);
  }

  return PASSPORT_DESKTOP_OFFERS_AVAILABLE;
}

export function formatPassportDesktopOfferDeadline(
  offer: Pick<PartnerOfferPublic, "valid_from" | "valid_until">,
): string | null {
  if (!offer.valid_until) return null;
  const end = new Date(offer.valid_until);
  if (Number.isNaN(end.getTime())) return null;
  const dateLabel = end.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const timeLabel = end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${dateLabel} · ${timeLabel}`;
}

export function formatPassportDesktopPartnerLocation(
  partner: Pick<PartnerPublic, "address" | "city">,
): string {
  const street = partner.address?.split(",")[0]?.trim();
  if (street) return street;
  return PASSPORT_DESKTOP_PARTNERS_LOCATION;
}

export function formatPassportDesktopLevelName(label: string): string {
  if (label.trim().toLowerCase() === "ambassadeur") return "Ambassadeur local";
  return label;
}

export function resolvePassportOfferCategoryBadge(
  partner: Pick<PartnerOfferPublic["partner"], "category">,
): string | null {
  const raw = (partner.category ?? "").toLowerCase();
  if (/food|resto|cuisine|café|cafe|asian|bar/.test(raw)) return PASSPORT_DESKTOP_CATEGORY_FOOD;
  if (/culture|musée|musee|museum|patrimoine/.test(raw)) return PASSPORT_DESKTOP_CATEGORY_CULTURE;
  if (/bien|wellness|barb|soin|spa/.test(raw)) return PASSPORT_DESKTOP_CATEGORY_WELLNESS;
  if (/commerce|shop|boutique/.test(raw)) return PASSPORT_DESKTOP_CATEGORY_SHOPS;
  if (/loisir|sport|night/.test(raw)) return PASSPORT_DESKTOP_CATEGORY_LEISURE;
  return null;
}

export function resolvePassportOfferCategoryBadgeClass(category: string): string {
  if (category === PASSPORT_DESKTOP_CATEGORY_WELLNESS) return "bg-emerald-600";
  if (category === PASSPORT_DESKTOP_CATEGORY_CULTURE) return "bg-violet-600";
  if (category === PASSPORT_DESKTOP_CATEGORY_SHOPS) return "bg-yunicity-primary";
  if (category === PASSPORT_DESKTOP_CATEGORY_LEISURE) return "bg-fuchsia-600";
  return "bg-orange-500";
}

export function resolvePassportDesktopCategoryTone(category: string | null | undefined): string {
  const key = category?.trim().toLowerCase() ?? "";
  if (
    key.includes("food") ||
    key.includes("resto") ||
    key.includes("cuisine") ||
    key.includes("café") ||
    key.includes("cafe")
  ) {
    return "text-orange-600";
  }
  if (key.includes("bien") || key.includes("wellness") || key.includes("barb")) {
    return "text-emerald-600";
  }
  if (key.includes("culture") || key.includes("musée") || key.includes("musee")) {
    return "text-violet-600";
  }
  if (key.includes("commerce") || key.includes("shop")) {
    return "text-yunicity-primary";
  }
  if (key.includes("loisir") || key.includes("sport") || key.includes("night")) {
    return "text-violet-600";
  }
  return "text-orange-600";
}

export function matchesPassportOfferCategory(
  offer: PartnerOfferPublic,
  categoryId: string,
): boolean {
  if (categoryId === "all" || categoryId === "") return true;
  const raw = `${offer.partner.category ?? ""} ${offer.title}`.toLowerCase();
  if (categoryId === "food") {
    return /food|resto|cuisine|café|cafe|asian|bar/.test(raw);
  }
  if (categoryId === "culture") {
    return /culture|musée|musee|museum|patrimoine/.test(raw);
  }
  if (categoryId === "wellness") {
    return /bien|wellness|barb|soin|spa/.test(raw);
  }
  if (categoryId === "shops") {
    return /commerce|shop|boutique/.test(raw);
  }
  if (categoryId === "leisure") {
    return /loisir|sport|night/.test(raw);
  }
  return true;
}

export type PassportOffersTabFilterInput = {
  offers: PartnerOfferPublic[];
  query: string;
  categoryId: string;
  availableNow: boolean;
  savedOnly: boolean;
  savedIds: ReadonlySet<string>;
  now?: Date;
};

export function filterPassportOffersTab({
  offers,
  query,
  categoryId,
  availableNow,
  savedOnly,
  savedIds,
  now = new Date(),
}: PassportOffersTabFilterInput): PartnerOfferPublic[] {
  const needle = query.trim().toLowerCase();
  return offers.filter((offer) => {
    if (!matchesPassportOfferCategory(offer, categoryId)) return false;
    if (availableNow && !isPartnerOfferActive(offer, now)) return false;
    if (savedOnly && !savedIds.has(offer.id)) return false;
    if (!needle) return true;
    const haystack =
      `${offer.title} ${offer.value_label ?? ""} ${offer.partner.name} ${offer.partner.category ?? ""}`.toLowerCase();
    return haystack.includes(needle);
  });
}

export function pickPassportDesktopFlashOffer(
  offers: PartnerOfferPublic[],
  now = new Date(),
): PartnerOfferPublic | null {
  const byExpiry = offers.find((offer) => isPartnerOfferFlash(offer, now));
  if (byExpiry) return byExpiry;
  const byLabel = offers.find((offer) => partnerOfferFlashLabel(offer) != null);
  if (byLabel) return byLabel;
  return offers.find((offer) => offer.is_featured) ?? null;
}

export function buildPassportOfferAboutCopy(offer: PartnerOfferPublic): string {
  const fromReadiness = offer.readiness?.human_description?.trim();
  const fromDescription = offer.description?.trim();
  if (fromDescription) return fromDescription;
  if (fromReadiness) return fromReadiness;
  return PASSPORT_OFFER_DETAIL_DEFAULT_ABOUT(offer.partner.name);
}

export function buildPassportOfferConditionItems(offer: PartnerOfferPublic): string[] {
  const items = [PASSPORT_OFFER_DETAIL_CONDITION_ACTIVE];
  const extra = offer.conditions?.trim();
  if (extra) {
    for (const part of extra.split(/[\n•|;]+/)) {
      const line = part.trim().replace(/\.$/, "");
      if (line && !items.some((item) => item.toLowerCase() === line.toLowerCase())) {
        items.push(line);
      }
    }
  }
  if (!items.some((item) => item.toLowerCase().includes("sur place"))) {
    items.push(PASSPORT_OFFER_DETAIL_USAGE_ON_SITE);
  }
  return items.slice(0, 5);
}

export function pickPassportOfferRelated(
  offers: PartnerOfferPublic[],
  currentId: string,
  limit = 3,
): PartnerOfferPublic[] {
  return offers.filter((offer) => offer.id !== currentId).slice(0, limit);
}
