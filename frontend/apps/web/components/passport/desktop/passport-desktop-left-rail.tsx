"use client";

import {
  PASSPORT_DESKTOP_CATEGORY_CULTURE,
  PASSPORT_DESKTOP_CATEGORY_FOOD,
  PASSPORT_DESKTOP_CATEGORY_LEISURE,
  PASSPORT_DESKTOP_CATEGORY_SHOPS,
  PASSPORT_DESKTOP_CATEGORY_WELLNESS,
  PASSPORT_DESKTOP_CATEGORIES_TITLE,
  PASSPORT_DESKTOP_CITY_PICKER_LABEL,
  PASSPORT_DESKTOP_NAV_SAVED,
  PASSPORT_DESKTOP_UNDERSTAND_CTA,
  PASSPORT_NAV_ITEMS,
  type PassportNavId,
} from "@yunicity/utils";
import { PassportBookletIcon } from "@/components/passport/passport-booklet-icon";
import {
  Bookmark,
  CircleHelp,
  Clock3,
  Drama,
  Landmark,
  MapPin,
  ShoppingBag,
  HeartPulse,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type { PassportNavId as PassportDesktopNavId };

type PassportDesktopLeftRailProps = {
  city: string;
  activeNav: PassportNavId;
  onNavigate: (targetId: string, navId: PassportNavId) => void;
  onSelectCategory: (categoryId: string) => void;
  activeCategory?: string;
};

const NAV_ITEMS = [
  ...PASSPORT_NAV_ITEMS,
  { id: "saved" as const, label: PASSPORT_DESKTOP_NAV_SAVED, target: "passport-desktop-saved" },
];

const CATEGORY_ITEMS: Array<{ id: string; label: string; icon: LucideIcon; tone: string }> = [
  { id: "food", label: PASSPORT_DESKTOP_CATEGORY_FOOD, icon: UtensilsCrossed, tone: "text-orange-500" },
  { id: "culture", label: PASSPORT_DESKTOP_CATEGORY_CULTURE, icon: Landmark, tone: "text-violet-600" },
  { id: "wellness", label: PASSPORT_DESKTOP_CATEGORY_WELLNESS, icon: HeartPulse, tone: "text-teal-600" },
  { id: "shops", label: PASSPORT_DESKTOP_CATEGORY_SHOPS, icon: ShoppingBag, tone: "text-yunicity-primary" },
  { id: "leisure", label: PASSPORT_DESKTOP_CATEGORY_LEISURE, icon: Drama, tone: "text-violet-600" },
];

export function PassportDesktopLeftRail({
  city,
  activeNav,
  onNavigate,
  onSelectCategory,
  activeCategory,
}: PassportDesktopLeftRailProps) {
  return (
    <aside
      className="passport-desktop-left-rail"
      aria-label="Navigation Passport"
      data-passport-desktop-left-rail=""
    >
      <div className="feed-desktop-surface mb-3 flex items-center gap-2 px-3 py-2.5">
        <MapPin className="h-4 w-4 text-yunicity-primary" aria-hidden />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            {PASSPORT_DESKTOP_CITY_PICKER_LABEL}
          </p>
          <p className="truncate text-sm font-bold text-neutral-900">{city}</p>
        </div>
      </div>

      <nav className="feed-desktop-surface p-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon =
              item.id === "offers"
                ? Tag
                : item.id === "partners"
                  ? MapPin
                  : item.id === "history"
                    ? Clock3
                    : Bookmark;
            const active = activeNav === item.id;
            const iconClassName = `h-4 w-4 shrink-0 ${active ? "text-yunicity-primary" : "text-neutral-500"}`;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.target, item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                    active
                      ? "bg-[#EEF0FF] text-yunicity-primary"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {item.id === "overview" ? (
                    <PassportBookletIcon className={iconClassName} />
                  ) : (
                    <Icon className={iconClassName} aria-hidden />
                  )}
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="feed-desktop-surface mt-4 p-3" aria-labelledby="passport-desktop-categories">
        <h2 id="passport-desktop-categories" className="px-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
          {PASSPORT_DESKTOP_CATEGORIES_TITLE}
        </h2>
        <ul className="mt-2 space-y-0.5">
          {CATEGORY_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeCategory === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectCategory(item.id)}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                    active ? "bg-[#EEF0FF] text-yunicity-primary" : "text-neutral-700"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${item.tone}`} aria-hidden />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <button
        type="button"
        onClick={() => onNavigate("passport-desktop-how", "overview")}
        className="mt-4 flex w-full items-center gap-2 rounded-2xl border border-yunicity-primary/30 bg-white px-3 py-2.5 text-left text-[13px] font-semibold leading-snug text-yunicity-primary transition hover:bg-[#EEF0FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
      >
        <CircleHelp className="h-4 w-4" aria-hidden />
        {PASSPORT_DESKTOP_UNDERSTAND_CTA}
      </button>
    </aside>
  );
}
