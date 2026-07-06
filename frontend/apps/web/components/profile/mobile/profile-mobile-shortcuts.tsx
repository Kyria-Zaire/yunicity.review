"use client";

import type { ProfileMobileShortcut } from "@yunicity/utils";
import {
  BarChart3,
  Bookmark,
  CalendarDays,
  ChevronRight,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

const SHORTCUT_ICONS: Record<ProfileMobileShortcut["id"], LucideIcon> = {
  favorites: Bookmark,
  events: CalendarDays,
  offers: Tag,
  activity: BarChart3,
};

type ProfileMobileShortcutsProps = {
  shortcuts: ProfileMobileShortcut[];
};

/** Grille raccourcis profil mobile (MOBILE-PROFILE-01). */
export function ProfileMobileShortcuts({ shortcuts }: ProfileMobileShortcutsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {shortcuts.map((shortcut) => {
        const Icon = SHORTCUT_ICONS[shortcut.id];
        return (
          <Link
            key={shortcut.id}
            href={shortcut.href}
            className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white px-3 py-3 shadow-sm transition hover:border-yunicity-primary/20 hover:shadow-md"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-yunicity-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-neutral-900">
                {shortcut.label}
              </span>
              {shortcut.showAsLink ? (
                <span className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-semibold text-yunicity-primary">
                  {shortcut.valueLabel}
                  <ChevronRight className="h-3 w-3" aria-hidden />
                </span>
              ) : (
                <span className="mt-0.5 block text-lg font-bold leading-none text-neutral-900">
                  {shortcut.valueLabel}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
