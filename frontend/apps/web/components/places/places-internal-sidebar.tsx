"use client";

import {
  PLACES_SIDEBAR_CATEGORIES,
  PLACES_SIDEBAR_CONTRIBUTIONS,
  PLACES_SIDEBAR_CTA_BODY,
  PLACES_SIDEBAR_CTA_BUTTON,
  PLACES_SIDEBAR_CTA_TITLE,
  PLACES_SIDEBAR_EVENTS,
  PLACES_SIDEBAR_FAVORITES,
  PLACES_SIDEBAR_FAVORITES_SOON,
  PLACES_SIDEBAR_NEWS,
  PLACES_SIDEBAR_OVERVIEW,
  PLACES_SIDEBAR_RECENT,
  PLACES_SIDEBAR_TITLE,
} from "@yunicity/utils";
import {
  Bookmark,
  Clock3,
  Grid3x3,
  LayoutGrid,
  MapPin,
  Newspaper,
  PenLine,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type SidebarItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

type PlacesInternalSidebarProps = {
  onScrollTo: (sectionId: string) => void;
};

function NavRow({
  item,
  active,
}: {
  item: SidebarItem;
  active: boolean;
}) {
  const Icon = item.icon;
  const className = `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
    active
      ? "bg-yunicity-primary text-white shadow-sm"
      : item.disabled
        ? "cursor-not-allowed text-neutral-400"
        : "text-neutral-700 hover:bg-white"
  }`;

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
      <span className="truncate">{item.label}</span>
    </>
  );

  if (item.disabled) {
    return (
      <button type="button" disabled className={className} title={PLACES_SIDEBAR_FAVORITES_SOON}>
        {content}
      </button>
    );
  }

  if (item.href) {
    return (
      <Link href={item.href} className={className} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={item.onClick} className={className}>
      {content}
    </button>
  );
}

export function PlacesInternalSidebar({ onScrollTo }: PlacesInternalSidebarProps) {
  const items: SidebarItem[] = [
    {
      id: "overview",
      label: PLACES_SIDEBAR_OVERVIEW,
      icon: LayoutGrid,
      onClick: () => onScrollTo("places-overview"),
    },
    {
      id: "categories",
      label: PLACES_SIDEBAR_CATEGORIES,
      icon: Grid3x3,
      onClick: () => onScrollTo("places-categories"),
    },
    {
      id: "events",
      label: PLACES_SIDEBAR_EVENTS,
      icon: Sparkles,
      href: "/sortir",
    },
    {
      id: "news",
      label: PLACES_SIDEBAR_NEWS,
      icon: Newspaper,
      href: "/feed",
    },
    {
      id: "favorites",
      label: PLACES_SIDEBAR_FAVORITES,
      icon: Bookmark,
      disabled: true,
    },
    {
      id: "recent",
      label: PLACES_SIDEBAR_RECENT,
      icon: Clock3,
      onClick: () => onScrollTo("places-recent"),
    },
    {
      id: "contributions",
      label: PLACES_SIDEBAR_CONTRIBUTIONS,
      icon: PenLine,
      href: "/organizations/request",
    },
  ];

  return (
    <aside className="hidden w-56 shrink-0 lg:block xl:w-60">
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6 pr-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-yunicity-primary text-white shadow-sm">
            <MapPin className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-base font-bold text-neutral-900">{PLACES_SIDEBAR_TITLE}</p>
        </div>

        <nav className="mt-6 space-y-1" aria-label="Navigation Lieux">
          {items.map((item) => (
            <NavRow key={item.id} item={item} active={item.id === "overview"} />
          ))}
        </nav>

        <div className="mt-8 rounded-2xl bg-[#EEF0FF] p-5">
          <p className="text-sm font-semibold text-neutral-900">{PLACES_SIDEBAR_CTA_TITLE}</p>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">{PLACES_SIDEBAR_CTA_BODY}</p>
          <Link
            href="/organizations/request"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            {PLACES_SIDEBAR_CTA_BUTTON}
          </Link>
        </div>
      </div>
    </aside>
  );
}
