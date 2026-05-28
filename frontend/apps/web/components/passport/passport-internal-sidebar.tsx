"use client";

import {
  PASSPORT_AMBASSADOR_BODY,
  PASSPORT_AMBASSADOR_CTA,
  PASSPORT_AMBASSADOR_TITLE,
  PASSPORT_DASHBOARD_SUBTITLE,
  PASSPORT_DASHBOARD_TITLE,
  PASSPORT_NAV_BADGES,
  PASSPORT_NAV_HISTORY,
  PASSPORT_NAV_OVERVIEW,
  PASSPORT_NAV_PRIVILEGES,
  PASSPORT_NAV_STATS,
  PASSPORT_NAV_TIPS,
} from "@yunicity/utils";
import type { PassportDashboardNavId } from "@/hooks/use-passport-dashboard-context";

const NAV_ITEMS: { id: PassportDashboardNavId; label: string; target: string }[] = [
  { id: "overview", label: PASSPORT_NAV_OVERVIEW, target: "passport-overview" },
  { id: "stats", label: PASSPORT_NAV_STATS, target: "passport-stats" },
  { id: "badges", label: PASSPORT_NAV_BADGES, target: "passport-badges" },
  { id: "privileges", label: PASSPORT_NAV_PRIVILEGES, target: "passport-privileges" },
  { id: "history", label: PASSPORT_NAV_HISTORY, target: "passport-history" },
  { id: "tips", label: PASSPORT_NAV_TIPS, target: "passport-tips" },
];

type PassportInternalSidebarProps = {
  activeNav: PassportDashboardNavId;
  onNavigate: (target: string) => void;
};

export function PassportInternalSidebar({ activeNav, onNavigate }: PassportInternalSidebarProps) {
  return (
    <aside className="w-full shrink-0 lg:w-56 xl:w-60">
      <div className="lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
        <p className="text-lg font-bold text-neutral-900">{PASSPORT_DASHBOARD_TITLE}</p>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600">{PASSPORT_DASHBOARD_SUBTITLE}</p>

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0" aria-label="Navigation Passport">
          {NAV_ITEMS.map((item) => {
            const active = item.id === activeNav;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.target)}
                className={`shrink-0 rounded-xl px-3 py-2 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary lg:w-full ${
                  active
                    ? "bg-yunicity-primary text-white shadow-sm"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 hidden rounded-2xl border border-neutral-200/90 bg-neutral-50 p-4 lg:block">
          <p className="text-sm font-semibold text-neutral-900">{PASSPORT_AMBASSADOR_TITLE}</p>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">{PASSPORT_AMBASSADOR_BODY}</p>
          <button
            type="button"
            onClick={() => onNavigate("passport-progression")}
            className="mt-4 w-full rounded-full bg-yunicity-primary px-4 py-2 text-xs font-semibold text-white hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            {PASSPORT_AMBASSADOR_CTA}
          </button>
        </div>
      </div>
    </aside>
  );
}
