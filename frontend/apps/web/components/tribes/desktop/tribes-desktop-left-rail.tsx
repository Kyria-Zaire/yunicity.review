"use client";

import type { Neighborhood } from "@yunicity/types";
import type { TribesDesktopNavId, TribesDesktopVisibilityId } from "@yunicity/utils";
import {
  TRIBES_DESKTOP_LEFT_TITLE,
  TRIBES_DESKTOP_NAV_DISCOVER,
  TRIBES_DESKTOP_NAV_INVITATIONS,
  TRIBES_DESKTOP_NAV_MINE,
  TRIBES_DESKTOP_NAV_SAVED,
  TRIBES_DESKTOP_NAV_SAVED_SOON,
  TRIBES_DESKTOP_NAV_SENT,
  TRIBES_DESKTOP_NEIGHBORHOODS_TITLE,
  TRIBES_DESKTOP_NEIGHBORHOOD_ALL,
  TRIBES_DESKTOP_PRIVACY_ALL,
  TRIBES_DESKTOP_PRIVACY_ON_REQUEST,
  TRIBES_DESKTOP_PRIVACY_PUBLIC,
  TRIBES_DESKTOP_PRIVACY_TITLE,
  TRIBES_DESKTOP_RESET_FILTERS,
} from "@yunicity/utils";
import {
  Bookmark,
  Building2,
  Compass,
  Globe,
  Lock,
  Mail,
  MapPin,
  RotateCcw,
  Send,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TribesDesktopLeftRailProps = {
  city: string;
  activeNav: TribesDesktopNavId;
  activeVisibility: TribesDesktopVisibilityId;
  activeNeighborhood: string;
  neighborhoods: Neighborhood[];
  onNavChange: (navId: TribesDesktopNavId) => void;
  onVisibilityChange: (visibilityId: TribesDesktopVisibilityId) => void;
  onNeighborhoodChange: (slug: string) => void;
  onResetFilters: () => void;
};

const NAV_OPTIONS: Array<{ id: TribesDesktopNavId; label: string; icon: LucideIcon; soon?: string }> = [
  { id: "discover", label: TRIBES_DESKTOP_NAV_DISCOVER, icon: Compass },
  { id: "mine", label: TRIBES_DESKTOP_NAV_MINE, icon: Users },
  { id: "invitations", label: TRIBES_DESKTOP_NAV_INVITATIONS, icon: Mail },
  { id: "sent_requests", label: TRIBES_DESKTOP_NAV_SENT, icon: Send },
  { id: "saved", label: TRIBES_DESKTOP_NAV_SAVED, icon: Bookmark, soon: TRIBES_DESKTOP_NAV_SAVED_SOON },
];

const VISIBILITY_OPTIONS: Array<{ id: TribesDesktopVisibilityId; label: string; icon: LucideIcon }> = [
  { id: "all", label: TRIBES_DESKTOP_PRIVACY_ALL, icon: Globe },
  { id: "public", label: TRIBES_DESKTOP_PRIVACY_PUBLIC, icon: Globe },
  { id: "on_request", label: TRIBES_DESKTOP_PRIVACY_ON_REQUEST, icon: Lock },
];

function RailButton({
  active,
  label,
  icon: Icon,
  soon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: LucideIcon;
  soon?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={soon}
      aria-pressed={active}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
        active ? "bg-[#EEF0FF] text-yunicity-primary" : "text-neutral-800 hover:bg-neutral-50"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-yunicity-primary" : "text-neutral-500"}`} aria-hidden />
      {label}
    </button>
  );
}

export function TribesDesktopLeftRail({
  city,
  activeNav,
  activeVisibility,
  activeNeighborhood,
  neighborhoods,
  onNavChange,
  onVisibilityChange,
  onNeighborhoodChange,
  onResetFilters,
}: TribesDesktopLeftRailProps) {
  return (
    <aside className="tribes-desktop-left-rail" aria-label="Navigation Tribus" data-tribes-desktop-left-rail="">
      <div className="feed-desktop-surface p-4">
        <h2 className="text-xl font-bold text-neutral-900">{TRIBES_DESKTOP_LEFT_TITLE}</h2>

        <nav className="mt-4 space-y-0.5" aria-label="Vues Tribus">
          {NAV_OPTIONS.map((option) => (
            <RailButton
              key={option.id}
              active={activeNav === option.id}
              label={option.label}
              icon={option.icon}
              soon={option.soon}
              onClick={() => onNavChange(option.id)}
            />
          ))}
        </nav>

        <div className="my-4 border-t border-neutral-100" />

        <p className="text-sm font-bold text-neutral-900">{TRIBES_DESKTOP_PRIVACY_TITLE}</p>
        <nav className="mt-2 space-y-0.5" aria-label={TRIBES_DESKTOP_PRIVACY_TITLE}>
          {VISIBILITY_OPTIONS.map((option) => (
            <RailButton
              key={option.id}
              active={activeVisibility === option.id}
              label={option.label}
              icon={option.icon}
              onClick={() => onVisibilityChange(option.id)}
            />
          ))}
        </nav>

        <div className="my-4 border-t border-neutral-100" />

        <p className="text-sm font-bold text-neutral-900">{TRIBES_DESKTOP_NEIGHBORHOODS_TITLE}</p>
        <nav className="mt-2 space-y-0.5" aria-label={TRIBES_DESKTOP_NEIGHBORHOODS_TITLE}>
          <RailButton
            active={activeNeighborhood === "all"}
            label={TRIBES_DESKTOP_NEIGHBORHOOD_ALL(city)}
            icon={MapPin}
            onClick={() => onNeighborhoodChange("all")}
          />
          {neighborhoods.map((hood) => (
            <RailButton
              key={hood.id}
              active={activeNeighborhood === hood.slug}
              label={hood.display_name}
              icon={Building2}
              onClick={() => onNeighborhoodChange(hood.slug)}
            />
          ))}
        </nav>

        <button
          type="button"
          onClick={onResetFilters}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary/30 px-3 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary hover:bg-[#EEF0FF]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          {TRIBES_DESKTOP_RESET_FILTERS}
        </button>
      </div>
    </aside>
  );
}
