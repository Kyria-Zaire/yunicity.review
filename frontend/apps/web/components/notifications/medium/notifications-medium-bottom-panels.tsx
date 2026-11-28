"use client";

import type { UserNotificationPreferences } from "@yunicity/types";
import {
  NOTIFICATIONS_DESKTOP_RAIL_MANAGE_SUBTITLE,
  NOTIFICATIONS_DESKTOP_RAIL_MANAGE_TITLE,
  NOTIFICATIONS_DESKTOP_RAIL_OPEN_PREFERENCES,
  NOTIFICATIONS_DESKTOP_RAIL_PREF_CONTRIBUTIONS,
  NOTIFICATIONS_DESKTOP_RAIL_PREF_EVENTS,
  NOTIFICATIONS_DESKTOP_RAIL_PREF_PASSPORT,
  NOTIFICATIONS_DESKTOP_RAIL_PREF_TRIBES,
  NOTIFICATIONS_DESKTOP_RAIL_TRUST_BODY,
  NOTIFICATIONS_DESKTOP_RAIL_TRUST_TITLE,
} from "@yunicity/utils";
import { CalendarDays, FileCheck, Globe, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

type NotificationsMediumBottomPanelsProps = {
  preferences: UserNotificationPreferences | null;
  isSavingPrefs: boolean;
  onPreferenceChange: (key: keyof UserNotificationPreferences, value: boolean) => void;
};

const PREF_TILES = [
  {
    key: "social" as const,
    label: NOTIFICATIONS_DESKTOP_RAIL_PREF_EVENTS,
    icon: CalendarDays,
    iconClass: "text-emerald-700",
  },
  {
    key: "social" as const,
    label: NOTIFICATIONS_DESKTOP_RAIL_PREF_TRIBES,
    icon: Users,
    iconClass: "text-sky-700",
  },
  {
    key: "passport" as const,
    label: NOTIFICATIONS_DESKTOP_RAIL_PREF_PASSPORT,
    icon: Globe,
    iconClass: "text-yunicity-primary",
  },
  {
    key: "offers" as const,
    label: NOTIFICATIONS_DESKTOP_RAIL_PREF_CONTRIBUTIONS,
    icon: FileCheck,
    iconClass: "text-violet-700",
  },
] as const;

export function NotificationsMediumBottomPanels({
  preferences,
  isSavingPrefs,
  onPreferenceChange,
}: NotificationsMediumBottomPanelsProps) {
  return (
    <div
      className="mt-6 grid gap-4 md:grid-cols-2"
      data-notifications-medium-bottom=""
    >
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{NOTIFICATIONS_DESKTOP_RAIL_MANAGE_TITLE}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
          {NOTIFICATIONS_DESKTOP_RAIL_MANAGE_SUBTITLE}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {PREF_TILES.map((tile, index) => {
            const enabled = preferences?.[tile.key] ?? true;
            const Icon = tile.icon;
            return (
              <button
                key={`${tile.label}-${index}`}
                type="button"
                disabled={isSavingPrefs || !preferences}
                aria-pressed={enabled}
                onClick={() => onPreferenceChange(tile.key, !enabled)}
                className={`flex min-h-[3.25rem] items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary disabled:opacity-60 ${
                  enabled
                    ? "border-yunicity-primary/20 bg-[#F7F8FF]"
                    : "border-neutral-200 bg-white hover:bg-neutral-50"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${tile.iconClass}`} aria-hidden />
                <span className="text-xs font-semibold leading-snug text-neutral-900">{tile.label}</span>
              </button>
            );
          })}
        </div>
        <Link
          href="/settings"
          className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-yunicity-primary px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
        >
          {NOTIFICATIONS_DESKTOP_RAIL_OPEN_PREFERENCES}
        </Link>
      </section>

      <section className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200/90 bg-[#F7F8FF] p-6 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-yunicity-primary shadow-sm">
          <ShieldCheck className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-sm font-bold text-neutral-900">{NOTIFICATIONS_DESKTOP_RAIL_TRUST_TITLE}</h2>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-600">
          {NOTIFICATIONS_DESKTOP_RAIL_TRUST_BODY}
        </p>
      </section>
    </div>
  );
}
