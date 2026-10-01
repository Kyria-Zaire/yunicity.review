"use client";

import type { UserNotificationPreferences } from "@yunicity/types";
import type { NotificationsDesktopHighlight } from "@yunicity/utils";
import {
  NOTIFICATIONS_DESKTOP_MARK_ALL_READ,
  NOTIFICATIONS_DESKTOP_RAIL_DONT_MISS_TITLE,
  NOTIFICATIONS_DESKTOP_RAIL_MANAGE_SUBTITLE,
  NOTIFICATIONS_DESKTOP_RAIL_MANAGE_TITLE,
  NOTIFICATIONS_DESKTOP_RAIL_OPEN_PREFERENCES,
  NOTIFICATIONS_DESKTOP_RAIL_PREF_CONTRIBUTIONS,
  NOTIFICATIONS_DESKTOP_RAIL_PREF_EVENTS,
  NOTIFICATIONS_DESKTOP_RAIL_PREF_PASSPORT,
  NOTIFICATIONS_DESKTOP_RAIL_PREF_TRIBES,
  NOTIFICATIONS_DESKTOP_RAIL_SUMMARY_DISPLAYED,
  NOTIFICATIONS_DESKTOP_RAIL_SUMMARY_TITLE,
  NOTIFICATIONS_DESKTOP_RAIL_SUMMARY_UNREAD,
  NOTIFICATIONS_DESKTOP_RAIL_TRUST_BODY,
  NOTIFICATIONS_DESKTOP_RAIL_TRUST_TITLE,
  NOTIFICATIONS_PREF_OFFERS_HINT,
  NOTIFICATIONS_PREF_PASSPORT_HINT,
  NOTIFICATIONS_PREF_SOCIAL_HINT,
} from "@yunicity/utils";
import {
  Award,
  CalendarDays,
  ChevronRight,
  Mail,
  MapPin,
  PenLine,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

type NotificationsDesktopRightRailProps = {
  unreadCount: number;
  displayedCount: number;
  highlights: NotificationsDesktopHighlight[];
  preferences: UserNotificationPreferences | null;
  isSavingPrefs: boolean;
  onMarkAllRead: () => void;
  onPreferenceChange: (key: keyof UserNotificationPreferences, value: boolean) => void;
};

const PREF_TILES = [
  {
    key: "social" as const,
    label: NOTIFICATIONS_DESKTOP_RAIL_PREF_EVENTS,
    hint: NOTIFICATIONS_PREF_SOCIAL_HINT,
    icon: CalendarDays,
  },
  {
    key: "social" as const,
    label: NOTIFICATIONS_DESKTOP_RAIL_PREF_TRIBES,
    hint: "Activité de vos tribus",
    icon: Users,
  },
  {
    key: "passport" as const,
    label: NOTIFICATIONS_DESKTOP_RAIL_PREF_PASSPORT,
    hint: NOTIFICATIONS_PREF_PASSPORT_HINT,
    icon: Award,
  },
  {
    key: "offers" as const,
    label: NOTIFICATIONS_DESKTOP_RAIL_PREF_CONTRIBUTIONS,
    hint: NOTIFICATIONS_PREF_OFFERS_HINT,
    icon: PenLine,
  },
] as const;

export function NotificationsDesktopRightRail({
  unreadCount,
  displayedCount,
  highlights,
  preferences,
  isSavingPrefs,
  onMarkAllRead,
  onPreferenceChange,
}: NotificationsDesktopRightRailProps) {
  return (
    <aside
      className="flex w-full min-w-0 flex-col gap-5 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pb-4"
      aria-label="Résumé et préférences"
      data-notifications-desktop-right-rail=""
    >
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF0FF] text-yunicity-primary">
            <Mail className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-neutral-900">{NOTIFICATIONS_DESKTOP_RAIL_SUMMARY_TITLE}</h2>
            <p className="mt-2 text-sm font-bold text-yunicity-primary">
              {NOTIFICATIONS_DESKTOP_RAIL_SUMMARY_UNREAD(unreadCount)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">
              {NOTIFICATIONS_DESKTOP_RAIL_SUMMARY_DISPLAYED(displayedCount)}
            </p>
          </div>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-yunicity-primary px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            {NOTIFICATIONS_DESKTOP_MARK_ALL_READ}
          </button>
        ) : null}
      </section>

      {highlights.length > 0 ? (
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900">{NOTIFICATIONS_DESKTOP_RAIL_DONT_MISS_TITLE}</h2>
          <ul className="mt-4 space-y-2">
            {highlights.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition hover:border-neutral-200 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF0FF] text-yunicity-primary">
                    <MapPin className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-900">{item.title}</span>
                    <span className="block truncate text-xs text-neutral-500">{item.timeLabel}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
                className={`flex min-h-[5.5rem] flex-col items-start gap-2 rounded-xl border px-3 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary disabled:opacity-60 ${
                  enabled
                    ? "border-yunicity-primary/20 bg-[#F7F8FF]"
                    : "border-neutral-200 bg-white hover:bg-neutral-50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
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

      <section className="rounded-2xl border border-neutral-200/90 bg-[#F7F8FF] p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-yunicity-primary shadow-sm">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-bold text-neutral-900">{NOTIFICATIONS_DESKTOP_RAIL_TRUST_TITLE}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
              {NOTIFICATIONS_DESKTOP_RAIL_TRUST_BODY}
            </p>
          </div>
        </div>
      </section>
    </aside>
  );
}
