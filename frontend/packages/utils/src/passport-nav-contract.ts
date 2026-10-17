import {
  PASSPORT_DESKTOP_NAV_HISTORY,
  PASSPORT_DESKTOP_NAV_OFFERS,
  PASSPORT_DESKTOP_NAV_PARTNERS,
  PASSPORT_DESKTOP_NAV_PASSPORT,
} from "./passport-desktop-labels";

export type PassportNavId = "overview" | "offers" | "partners" | "history" | "saved";

export const PASSPORT_NAV_ITEMS: ReadonlyArray<{
  id: PassportNavId;
  label: string;
  target: string;
}> = [
  { id: "overview", label: PASSPORT_DESKTOP_NAV_PASSPORT, target: "passport-desktop-overview" },
  { id: "offers", label: PASSPORT_DESKTOP_NAV_OFFERS, target: "passport-desktop-offers" },
  { id: "partners", label: PASSPORT_DESKTOP_NAV_PARTNERS, target: "passport-desktop-partners" },
  { id: "history", label: PASSPORT_DESKTOP_NAV_HISTORY, target: "passport-desktop-history" },
] as const;

export const PASSPORT_MEDIUM_CATEGORY_ALL = "Tout";
export const PASSPORT_MEDIUM_QR_PREVIEW = "APERÇU";

export type PassportOfferCategoryId =
  | "all"
  | "food"
  | "culture"
  | "wellness"
  | "shops"
  | "leisure";

export type PassportOffersSortId = "recent";
