"use client";

import type { VideosPortalTabId } from "@yunicity/utils";
import {
  VIDEOS_DESKTOP_LEFT_EVENTS,
  VIDEOS_DESKTOP_LEFT_PLACES,
  VIDEOS_DESKTOP_LEFT_SAVED,
  VIDEOS_DESKTOP_LOCAL_DISCLAIMER,
  VIDEOS_MOBILE_TAB_FOR_YOU,
  VIDEOS_PORTAL_PUBLISH_CTA,
  VIDEOS_PORTAL_TITLE,
  VIDEOS_TAB_NEARBY,
  VIDEOS_TAB_SUBSCRIPTIONS,
} from "@yunicity/utils";
import {
  Bookmark,
  CalendarDays,
  Compass,
  MapPin,
  PlayCircle,
  Shield,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";

export type VideosDesktopLeftNavId =
  | "for_you"
  | "nearby"
  | "subscriptions"
  | "events"
  | "places"
  | "saved";

type VideosDesktopLeftRailProps = {
  city: string;
  activeTab: VideosPortalTabId;
  onTabChange: (tab: VideosPortalTabId) => void;
};

const IN_PAGE_NAV: Array<{
  id: VideosDesktopLeftNavId;
  label: string;
  icon: typeof PlayCircle;
  tab: VideosPortalTabId;
}> = [
  { id: "for_you", label: VIDEOS_MOBILE_TAB_FOR_YOU, icon: PlayCircle, tab: "all" },
  { id: "nearby", label: VIDEOS_TAB_NEARBY, icon: Compass, tab: "nearby" },
  { id: "subscriptions", label: VIDEOS_TAB_SUBSCRIPTIONS, icon: Users, tab: "subscriptions" },
];

const EXTERNAL_NAV: Array<{
  id: VideosDesktopLeftNavId;
  label: string;
  icon: typeof CalendarDays;
  href: string;
  tab?: VideosPortalTabId;
}> = [
  { id: "events", label: VIDEOS_DESKTOP_LEFT_EVENTS, icon: CalendarDays, href: "/sortir" },
  { id: "places", label: VIDEOS_DESKTOP_LEFT_PLACES, icon: MapPin, href: "/places" },
  {
    id: "saved",
    label: VIDEOS_DESKTOP_LEFT_SAVED,
    icon: Bookmark,
    href: "/videos",
    tab: "mine",
  },
];

function isTabActive(tab: VideosPortalTabId, activeTab: VideosPortalTabId): boolean {
  return tab === activeTab;
}

export function VideosDesktopLeftRail({ city, activeTab, onTabChange }: VideosDesktopLeftRailProps) {
  return (
    <aside className="videos-desktop-left-rail" aria-label="Navigation vidéos">
      <div className="feed-desktop-surface p-4">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700">
          <MapPin className="h-3.5 w-3.5 text-yunicity-primary" aria-hidden />
          {city}
        </div>

        <p className="text-sm font-bold text-neutral-900">{VIDEOS_PORTAL_TITLE}</p>

        <nav className="mt-3 space-y-0.5" aria-label="Vues vidéo">
          {IN_PAGE_NAV.map((item) => {
            const Icon = item.icon;
            const active = isTabActive(item.tab, activeTab);
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onTabChange(item.tab)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition active:scale-[0.99] ${
                  active
                    ? "bg-yunicity-primary-soft text-yunicity-primary"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                {item.label}
              </button>
            );
          })}

          {EXTERNAL_NAV.map((item) => {
            const Icon = item.icon;
            const active = item.tab != null && isTabActive(item.tab, activeTab);
            const rowClass = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition active:scale-[0.99] ${
              active
                ? "bg-yunicity-primary-soft text-yunicity-primary"
                : "text-neutral-700 hover:bg-neutral-50"
            }`;

            if (item.tab != null) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onTabChange(item.tab!)}
                  className={rowClass}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            }

            return (
              <Link key={item.id} href={item.href} className={rowClass}>
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/videos/new"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
        >
          <Video className="h-4 w-4" aria-hidden />
          {VIDEOS_PORTAL_PUBLISH_CTA}
        </Link>

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-neutral-500">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
          {VIDEOS_DESKTOP_LOCAL_DISCLAIMER}
        </p>
      </div>
    </aside>
  );
}
