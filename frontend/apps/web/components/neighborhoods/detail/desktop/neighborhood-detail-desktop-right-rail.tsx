"use client";

import { NeighborhoodDetailMapPreview } from "@/components/neighborhoods/detail/shared";
import type { NeighborhoodDetail } from "@yunicity/types";
import type { NeighborhoodDetailDesktopNowItem } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_DESKTOP_AMBIANCE_LINE,
  NEIGHBORHOOD_DETAIL_DESKTOP_BRIEF_TITLE,
  NEIGHBORHOOD_DETAIL_DESKTOP_CONTRIBUTE_BODY,
  NEIGHBORHOOD_DETAIL_DESKTOP_CONTRIBUTE_CTA,
  NEIGHBORHOOD_DETAIL_DESKTOP_FOLLOW,
  NEIGHBORHOOD_DETAIL_DESKTOP_FOLLOWING,
  NEIGHBORHOOD_DETAIL_DESKTOP_HOME_UNDEFINED,
  NEIGHBORHOOD_DETAIL_DESKTOP_IS_FOLLOWING,
  NEIGHBORHOOD_DETAIL_DESKTOP_LOCAL_LIFE_COUNCIL,
  NEIGHBORHOOD_DETAIL_DESKTOP_LOCAL_LIFE_LIBRARY,
  NEIGHBORHOOD_DETAIL_DESKTOP_LOCAL_LIFE_SERVICES,
  NEIGHBORHOOD_DETAIL_DESKTOP_LOCAL_LIFE_TITLE,
  NEIGHBORHOOD_DETAIL_DESKTOP_NOT_FOLLOWING,
  NEIGHBORHOOD_DETAIL_DESKTOP_NOW_TITLE,
  NEIGHBORHOOD_DETAIL_DESKTOP_OPEN_MAP,
  NEIGHBORHOOD_DETAIL_DESKTOP_RELATION_HINT,
  NEIGHBORHOOD_DETAIL_DESKTOP_RELATION_TITLE,
  NEIGHBORHOOD_DETAIL_DESKTOP_SECTOR,
  NEIGHBORHOOD_DETAIL_DESKTOP_SEE_AGENDA,
  NEIGHBORHOOD_DETAIL_DESKTOP_SET_HOME,
} from "@yunicity/utils";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Home,
  Lightbulb,
  Map,
  MapPinned,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

type NeighborhoodDetailDesktopRightRailProps = {
  detail: NeighborhoodDetail;
  ambianceLine: string;
  sectorHint: string;
  mapHref: string;
  agendaHref: string;
  nowItems: NeighborhoodDetailDesktopNowItem[];
  isFollowing: boolean;
  isHome: boolean;
  onToggleFollow: () => void;
  onSetHome: () => void;
  onContribute: () => void;
};

export function NeighborhoodDetailDesktopRightRail({
  detail,
  ambianceLine,
  sectorHint,
  mapHref,
  agendaHref,
  nowItems,
  isFollowing,
  isHome,
  onToggleFollow,
  onSetHome,
  onContribute,
}: NeighborhoodDetailDesktopRightRailProps) {
  const name = detail.hero?.display_name ?? detail.display_name;

  const localLifeLinks = [
    { id: "council", label: NEIGHBORHOOD_DETAIL_DESKTOP_LOCAL_LIFE_COUNCIL, href: mapHref },
    {
      id: "library",
      label: `${NEIGHBORHOOD_DETAIL_DESKTOP_LOCAL_LIFE_LIBRARY} ${name}`,
      href: `#nd-desktop-places`,
    },
    {
      id: "services",
      label: NEIGHBORHOOD_DETAIL_DESKTOP_LOCAL_LIFE_SERVICES,
      href: `#nd-desktop-practical`,
    },
  ];

  return (
    <aside className="space-y-4" aria-label="Informations du quartier">
      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-sm font-bold text-neutral-950">
            {NEIGHBORHOOD_DETAIL_DESKTOP_BRIEF_TITLE(name)}
          </h2>
        </div>
        <NeighborhoodDetailMapPreview
          detail={detail}
          mapHref={mapHref}
          title={NEIGHBORHOOD_DETAIL_DESKTOP_BRIEF_TITLE(name)}
          heightClassName="h-36"
        />
        <div className="space-y-2.5 px-4 py-3">
          <p className="inline-flex items-center gap-2 text-sm text-neutral-600">
            <MapPinned className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            {NEIGHBORHOOD_DETAIL_DESKTOP_SECTOR(detail.city, sectorHint)}
          </p>
          <p className="inline-flex items-center gap-2 text-sm text-neutral-600">
            <Sparkles className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            {NEIGHBORHOOD_DETAIL_DESKTOP_AMBIANCE_LINE(ambianceLine)}
          </p>
          <Link
            href={mapHref}
            className="mt-1 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 hover:border-neutral-300"
          >
            <Map className="h-4 w-4 text-yunicity-primary" aria-hidden />
            {NEIGHBORHOOD_DETAIL_DESKTOP_OPEN_MAP}
          </Link>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-950">
          {NEIGHBORHOOD_DETAIL_DESKTOP_RELATION_TITLE}
        </h2>
        <p className="text-sm text-neutral-600">
          {isFollowing
            ? NEIGHBORHOOD_DETAIL_DESKTOP_IS_FOLLOWING(name)
            : NEIGHBORHOOD_DETAIL_DESKTOP_NOT_FOLLOWING(name)}
        </p>
        <button
          type="button"
          onClick={onToggleFollow}
          className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${
            isFollowing
              ? "border border-yunicity-primary/30 bg-yunicity-primary/5 text-yunicity-primary"
              : "bg-yunicity-primary text-white hover:bg-yunicity-primary/90"
          }`}
        >
          {isFollowing ? NEIGHBORHOOD_DETAIL_DESKTOP_FOLLOWING : NEIGHBORHOOD_DETAIL_DESKTOP_FOLLOW}
        </button>
        <p className="text-sm text-neutral-600">
          {isHome ? `Quartier de vie : ${name}` : NEIGHBORHOOD_DETAIL_DESKTOP_HOME_UNDEFINED}
        </p>
        <button
          type="button"
          onClick={onSetHome}
          disabled={isHome}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 hover:border-neutral-300 disabled:cursor-default disabled:opacity-70"
        >
          <Home className="h-4 w-4" aria-hidden />
          {isHome ? "Mon quartier de vie" : NEIGHBORHOOD_DETAIL_DESKTOP_SET_HOME}
        </button>
        <p className="text-xs leading-relaxed text-neutral-500">
          {NEIGHBORHOOD_DETAIL_DESKTOP_RELATION_HINT}
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-950">{NEIGHBORHOOD_DETAIL_DESKTOP_NOW_TITLE}</h2>
        {nowItems.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Rien de programmé pour l’instant.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {nowItems.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="flex gap-2.5 rounded-lg hover:bg-neutral-50">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-neutral-900">{item.title}</span>
                    <span className="block text-xs text-neutral-500">{item.whenLabel}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={agendaHref}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {NEIGHBORHOOD_DETAIL_DESKTOP_SEE_AGENDA}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-950">
          {NEIGHBORHOOD_DETAIL_DESKTOP_LOCAL_LIFE_TITLE}
        </h2>
        <ul className="mt-2 divide-y divide-neutral-100">
          {localLifeLinks.map((link) => (
            <li key={link.id}>
              <Link
                href={link.href}
                className="flex items-center justify-between gap-2 py-2.5 text-sm font-medium text-neutral-800 hover:text-yunicity-primary"
              >
                {link.label}
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
        <p className="text-sm text-neutral-700">{NEIGHBORHOOD_DETAIL_DESKTOP_CONTRIBUTE_BODY}</p>
        <button
          type="button"
          onClick={onContribute}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 hover:border-neutral-300"
        >
          <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden />
          {NEIGHBORHOOD_DETAIL_DESKTOP_CONTRIBUTE_CTA}
        </button>
      </section>
    </aside>
  );
}
