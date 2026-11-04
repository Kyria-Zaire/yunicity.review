"use client";

import type { ReactNode } from "react";
import { PassportBookletIcon } from "@/components/passport/passport-booklet-icon";
import {
  PASSPORT_DESKTOP_CATEGORY_CULTURE,
  PASSPORT_DESKTOP_CATEGORY_FOOD,
  PASSPORT_DESKTOP_CATEGORY_LEISURE,
  PASSPORT_DESKTOP_CATEGORY_SHOPS,
  PASSPORT_DESKTOP_CATEGORY_WELLNESS,
  PASSPORT_MEDIUM_CATEGORY_ALL,
  PASSPORT_NAV_ITEMS,
  type PassportNavId,
} from "@yunicity/utils";
import {
  Clock3,
  Drama,
  Gift,
  Landmark,
  LayoutGrid,
  ShoppingBag,
  HeartPulse,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type PassportMediumTabNavProps = {
  activeNav: PassportNavId;
  onNavigate: (targetId: string, navId: PassportNavId) => void;
};

function resolveTabIcon(id: PassportNavId): LucideIcon | "passport" {
  if (id === "overview") return "passport";
  if (id === "offers") return Gift;
  if (id === "partners") return Users;
  return Clock3;
}

function TabItemIcon({ id, className }: { id: PassportNavId; className: string }) {
  if (id === "overview") return <PassportBookletIcon className={className} />;
  const Icon = resolveTabIcon(id) as LucideIcon;
  return <Icon className={className} aria-hidden />;
}

export function PassportMediumTabNav({ activeNav, onNavigate }: PassportMediumTabNavProps) {
  return (
    <nav
      className="passport-medium-tab-nav border-b border-neutral-200"
      aria-label="Sections Passport"
      data-passport-medium-tab-nav=""
    >
      <ul className="flex gap-1 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PASSPORT_NAV_ITEMS.map((item) => {
          const active = activeNav === item.id;
          const iconClassName = `h-4 w-4 shrink-0 ${active ? "text-yunicity-primary" : "text-neutral-500"}`;

          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onNavigate(item.target, item.id)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                  active
                    ? "border-yunicity-primary text-yunicity-primary"
                    : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-800"
                }`}
              >
                <TabItemIcon id={item.id} className={iconClassName} />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const CATEGORY_ITEMS: Array<{ id: string; label: string; icon: LucideIcon; tone: string }> = [
  { id: "all", label: PASSPORT_MEDIUM_CATEGORY_ALL, icon: LayoutGrid, tone: "text-white" },
  { id: "food", label: PASSPORT_DESKTOP_CATEGORY_FOOD, icon: UtensilsCrossed, tone: "text-orange-500" },
  { id: "culture", label: PASSPORT_DESKTOP_CATEGORY_CULTURE, icon: Landmark, tone: "text-violet-600" },
  { id: "wellness", label: PASSPORT_DESKTOP_CATEGORY_WELLNESS, icon: HeartPulse, tone: "text-teal-600" },
  { id: "shops", label: PASSPORT_DESKTOP_CATEGORY_SHOPS, icon: ShoppingBag, tone: "text-yunicity-primary" },
  { id: "leisure", label: PASSPORT_DESKTOP_CATEGORY_LEISURE, icon: Drama, tone: "text-violet-600" },
];

type PassportMediumCategoryBarProps = {
  activeCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
  onNavigateOffers: () => void;
};

export function PassportMediumCategoryBar({
  activeCategory = "all",
  onCategorySelect,
  onNavigateOffers,
}: PassportMediumCategoryBarProps) {
  return (
    <div
      className="passport-medium-category-bar flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-passport-medium-category-bar=""
      role="toolbar"
      aria-label="Catégories d'offres"
    >
      {CATEGORY_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = activeCategory === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onCategorySelect?.(item.id);
              onNavigateOffers();
            }}
            aria-pressed={active}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
              active
                ? "border-yunicity-primary bg-yunicity-primary text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${active && item.id === "all" ? "text-white" : item.tone}`}
              aria-hidden
            />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

type PassportMediumHeroHeaderProps = {
  city: string;
  activeNav: PassportNavId;
  onNavigate: (targetId: string, navId: PassportNavId) => void;
  editorial: ReactNode;
  showCategories?: boolean;
  activeCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
};

export function PassportMediumHeroHeader({
  activeNav,
  onNavigate,
  editorial,
  showCategories = true,
  activeCategory = "all",
  onCategorySelect,
}: PassportMediumHeroHeaderProps) {
  return (
    <header className="passport-medium-hero-header space-y-3" data-passport-medium-hero-header="">
      {editorial}
      <PassportMediumTabNav activeNav={activeNav} onNavigate={onNavigate} />
      {showCategories ? (
        <PassportMediumCategoryBar
          activeCategory={activeCategory}
          onCategorySelect={onCategorySelect}
          onNavigateOffers={() => onNavigate("passport-desktop-offers", "offers")}
        />
      ) : null}
    </header>
  );
}
