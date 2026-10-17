"use client";

import type { TribesDesktopCategoryId } from "@yunicity/utils";
import {
  TRIBES_DESKTOP_CHIP_CULTURE,
  TRIBES_DESKTOP_CHIP_CREATORS,
  TRIBES_DESKTOP_CHIP_ENTRAIDE,
  TRIBES_DESKTOP_CHIP_FOR_YOU,
  TRIBES_DESKTOP_CHIP_NEARBY,
  TRIBES_DESKTOP_CHIP_PARENTS,
  TRIBES_DESKTOP_CHIP_SPORT,
  TRIBES_DESKTOP_CHIP_STUDENTS,
} from "@yunicity/utils";
import {
  Drama,
  GraduationCap,
  Heart,
  Home,
  MapPin,
  Pencil,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CHIP_OPTIONS: Array<{ id: TribesDesktopCategoryId; label: string; icon: LucideIcon }> = [
  { id: "for_you", label: TRIBES_DESKTOP_CHIP_FOR_YOU, icon: Home },
  { id: "nearby", label: TRIBES_DESKTOP_CHIP_NEARBY, icon: MapPin },
  { id: "culture", label: TRIBES_DESKTOP_CHIP_CULTURE, icon: Drama },
  { id: "sport", label: TRIBES_DESKTOP_CHIP_SPORT, icon: Users },
  { id: "students", label: TRIBES_DESKTOP_CHIP_STUDENTS, icon: GraduationCap },
  { id: "parents", label: TRIBES_DESKTOP_CHIP_PARENTS, icon: Users },
  { id: "creators", label: TRIBES_DESKTOP_CHIP_CREATORS, icon: Pencil },
  { id: "entraide", label: TRIBES_DESKTOP_CHIP_ENTRAIDE, icon: Heart },
];

type TribesMediumCategoryChipsProps = {
  activeCategory: TribesDesktopCategoryId;
  onCategoryChange: (categoryId: TribesDesktopCategoryId) => void;
};

export function TribesMediumCategoryChips({
  activeCategory,
  onCategoryChange,
}: TribesMediumCategoryChipsProps) {
  return (
    <nav
      aria-label="Catégories"
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-tribes-medium-category-chips=""
    >
      {CHIP_OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = activeCategory === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onCategoryChange(option.id)}
            aria-pressed={active}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "border-yunicity-primary bg-yunicity-primary text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {option.label}
          </button>
        );
      })}
    </nav>
  );
}
