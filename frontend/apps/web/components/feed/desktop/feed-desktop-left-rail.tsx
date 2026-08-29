"use client";

import type { FeedPortalView } from "@yunicity/utils";
import {
  FEED_PORTAL_LEFT_AROUND_ME,
  FEED_PORTAL_LEFT_CREATE,
  FEED_PORTAL_LEFT_FAVORITES,
  FEED_PORTAL_LEFT_FOR_YOU,
  FEED_PORTAL_LEFT_MY_EVENTS,
  FEED_PORTAL_LEFT_MY_TRIBES,
} from "@yunicity/utils";
import { CalendarDays, Compass, Heart, Home, Users } from "lucide-react";
import Link from "next/link";
import type { MutableRefObject } from "react";

import { CreateHubTriggerButton } from "@/components/create-hub/create-hub-trigger-button";
import type { FeedWeatherCardData } from "@/components/feed/portal/feed-weather-card";
import { FeedWeatherCard } from "@/components/feed/portal/feed-weather-card";

type FeedLeftNavId =
  | FeedPortalView
  | "home"
  | "for_you"
  | "favorites"
  | "my_events"
  | "my_tribes"
  | "discussions"
  | "stories"
  | "contributions"
  | "saved"
  | "subscriptions"
  | "nearby"
  | null;

type FeedDesktopLeftRailProps = {
  city: string;
  activeView: FeedPortalView;
  leftNav: FeedLeftNavId;
  onNavSelect: (nav: FeedLeftNavId) => void;
  weather: FeedWeatherCardData;
  /**
   * Sonde de visibilité du palier Desktop (R4). Le rail est `display: none`
   * sous 1280px : il n'intersecte jamais, donc le contrôleur n'arme aucune
   * requête de rail tant que le Desktop n'est pas réellement affiché.
   */
  desktopProbeRef?: MutableRefObject<HTMLElement | null>;
};

const NAV_ITEMS: Array<{
  id: FeedLeftNavId;
  label: string;
  icon: typeof Home;
  view?: FeedPortalView;
  href?: string;
  nav?: FeedLeftNavId;
}> = [
  { id: "for_you", label: FEED_PORTAL_LEFT_FOR_YOU, icon: Home, view: "for_you" },
  { id: "nearby", label: FEED_PORTAL_LEFT_AROUND_ME, icon: Compass, href: "/map" },
  { id: "favorites", label: FEED_PORTAL_LEFT_FAVORITES, icon: Heart, nav: "saved" },
  { id: "my_events", label: FEED_PORTAL_LEFT_MY_EVENTS, icon: CalendarDays, href: "/sortir" },
  { id: "my_tribes", label: FEED_PORTAL_LEFT_MY_TRIBES, icon: Users, href: "/tribes" },
];

export function FeedDesktopLeftRail({
  city,
  activeView,
  leftNav,
  onNavSelect,
  weather,
  desktopProbeRef,
}: FeedDesktopLeftRailProps) {
  return (
    <aside ref={desktopProbeRef} className="feed-desktop-left-rail" aria-label="Navigation du fil">
      <nav className="feed-desktop-surface p-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.id === "for_you"
              ? leftNav === null && activeView === "for_you"
              : item.nav != null
                ? leftNav === item.nav
                : leftNav === item.id ||
                  (item.view != null && activeView === item.view && leftNav === null);

          const rowClass = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.99] ${
            active
              ? "bg-yunicity-primary-soft text-yunicity-primary"
              : "text-neutral-700 hover:bg-neutral-50"
          }`;

          if (item.href) {
            return (
              <Link key={item.id ?? item.label} href={item.href} className={rowClass}>
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          }

          return (
            <button
              key={item.id ?? item.label}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => {
                if (item.nav != null) {
                  onNavSelect(item.nav);
                  return;
                }
                onNavSelect(item.view ?? item.id);
              }}
              className={`${rowClass} text-left`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </nav>

      <CreateHubTriggerButton variant="feed-left-rail" visibilitySurface="default" className="mt-4">
        {FEED_PORTAL_LEFT_CREATE}
      </CreateHubTriggerButton>

      <div className="mt-4">
        <FeedWeatherCard
          city={city}
          weather={weather.weather}
          loading={weather.loading}
          error={weather.error}
        />
      </div>
    </aside>
  );
}
