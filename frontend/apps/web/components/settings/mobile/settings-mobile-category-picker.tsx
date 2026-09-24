"use client";

import {
  SETTINGS_MOBILE_CATEGORIES,
  settingsMobileScrollToSection,
  type SettingsMobileCategoryId,
} from "@yunicity/utils";
import { ChevronDown, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SettingsMobileCategoryPickerProps = {
  activeCategoryId: SettingsMobileCategoryId;
  onCategoryChange: (id: SettingsMobileCategoryId) => void;
};

/** Sélecteur de catégorie mobile (Général / …). */
export function SettingsMobileCategoryPicker({
  activeCategoryId,
  onCategoryChange,
}: SettingsMobileCategoryPickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const active =
    SETTINGS_MOBILE_CATEGORIES.find((item) => item.id === activeCategoryId) ??
    SETTINGS_MOBILE_CATEGORIES[0]!;

  return (
    <div className="relative" data-settings-mobile-category="">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white px-3.5 py-3.5 text-left shadow-sm"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF0FF] text-yunicity-primary">
          <User className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-900">{active.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-20 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg"
        >
          {SETTINGS_MOBILE_CATEGORIES.map((category) => {
            const selected = category.id === activeCategoryId;
            return (
              <li key={category.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`flex w-full px-4 py-3 text-left text-sm font-medium transition ${
                    selected
                      ? "bg-[#EEF0FF] text-yunicity-primary"
                      : "text-neutral-800 hover:bg-neutral-50"
                  }`}
                  onClick={() => {
                    setOpen(false);
                    onCategoryChange(category.id);
                    if (category.href) {
                      router.push(category.href);
                      return;
                    }
                    if (category.sectionId) settingsMobileScrollToSection(category.sectionId);
                  }}
                >
                  {category.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
