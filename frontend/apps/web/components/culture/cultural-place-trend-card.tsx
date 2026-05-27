"use client";

import { CulturalImageCredit } from "@/components/culture/cultural-image";
import { resolveCulturalPlaceImageOverride } from "@/lib/cultural-place-image-overrides";
import type { CulturalPlaceListItem } from "@yunicity/types";
import {
  SEARCH_EXPLORER_CULTURE_BADGE,
  SEARCH_EXPLORER_CULTURE_CTA,
  SEARCH_EXPLORER_CULTURE_CTA_HINT,
  SEARCH_EXPLORER_CULTURE_ROUTE,
  culturalPlaceCategoryLabel,
  getCulturalPlaceImageCredit,
  resolveCulturalPlaceThumbnailUrl,
} from "@yunicity/utils";
import Link from "next/link";
import { useState, type ReactNode } from "react";

export type CulturalPlaceTrendCardProps = {
  place: CulturalPlaceListItem;
  selected?: boolean;
  expanded?: boolean;
  /** Pleine largeur (/search) ou compact rail droit (/map ~320px). */
  layout?: "full" | "rail";
  /** Liens statiques vers /search ; boutons interactifs sur /map. */
  mode?: "link" | "interactive";
  onSelectMap?: () => void;
  onRoute?: () => void;
};

export function CulturalPlaceTrendCard({
  place,
  selected = false,
  expanded = false,
  layout = "full",
  mode = "link",
  onSelectMap,
  onRoute,
}: CulturalPlaceTrendCardProps) {
  const credit = getCulturalPlaceImageCredit(place);
  const locationLabel = place.neighborhood?.display_name ?? place.address;
  const excerpt = place.editorial_excerpt || place.short_description;

  const cardClass = `rounded-3xl border shadow-sm transition ${
    selected
      ? "border-yunicity-primary/40 bg-yunicity-primary/5 shadow-md"
      : "border-neutral-200/90 bg-white hover:border-neutral-300/90 hover:shadow-md"
  }`;

  if (layout === "rail") {
    return (
      <article className={`space-y-3 p-3 ${cardClass}`}>
        <div className="flex gap-3">
          <PlaceThumb place={place} compact />
          <div className="min-w-0 flex-1">
            <MetaRow locationLabel={locationLabel} />
            <TitleBlock place={place} mode={mode} onSelectMap={onSelectMap} compact />
          </div>
        </div>
        <p className={`text-sm leading-relaxed text-neutral-500 ${expanded ? "" : "line-clamp-2"}`}>
          {excerpt}
        </p>
        <ActionRow
          mode={mode}
          category={place.category}
          onSelectMap={onSelectMap}
          onRoute={onRoute}
          compact
        />
        {credit ? <CulturalImageCredit credit={credit} /> : null}
      </article>
    );
  }

  return (
    <article className={`flex gap-3 p-3 sm:gap-4 sm:p-4 ${cardClass}`}>
      <PlaceThumb place={place} />

      <div className="min-w-0 flex-1">
        <MetaRow locationLabel={locationLabel} />
        <TitleBlock place={place} mode={mode} onSelectMap={onSelectMap} />
        <p className={`mt-1 text-sm leading-relaxed text-neutral-500 ${expanded ? "" : "line-clamp-2"}`}>
          {excerpt}
        </p>
        {credit ? (
          <div className="mt-2">
            <CulturalImageCredit credit={credit} />
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end justify-center gap-3 pl-1 sm:gap-4">
        <TrendAction
          mode={mode}
          icon={<MapPinIcon className="h-4 w-4" />}
          label={SEARCH_EXPLORER_CULTURE_CTA}
          hint={SEARCH_EXPLORER_CULTURE_CTA_HINT}
          onClick={onSelectMap}
        />
        <TrendAction
          mode={mode}
          icon={<RouteIcon className="h-4 w-4" />}
          label={SEARCH_EXPLORER_CULTURE_ROUTE}
          hint={culturalPlaceCategoryLabel(place.category)}
          onClick={onRoute}
        />
      </div>
    </article>
  );
}

function MetaRow({ locationLabel }: { locationLabel: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-800">
        {SEARCH_EXPLORER_CULTURE_BADGE}
      </span>
      <span className="text-neutral-300" aria-hidden>
        •
      </span>
      <span className="line-clamp-1">{locationLabel}</span>
    </div>
  );
}

function TitleBlock({
  place,
  mode,
  onSelectMap,
  compact = false,
}: {
  place: CulturalPlaceListItem;
  mode: "link" | "interactive";
  onSelectMap?: () => void;
  compact?: boolean;
}) {
  const titleClass = compact
    ? "mt-1 line-clamp-2 text-sm font-bold text-neutral-900"
    : "mt-2 line-clamp-1 text-base font-bold text-neutral-900 sm:text-lg";

  if (mode === "interactive") {
    return (
      <button type="button" onClick={onSelectMap} className={`${titleClass} text-left`}>
        {place.name}
      </button>
    );
  }

  return <h3 className={titleClass}>{place.name}</h3>;
}

function ActionRow({
  mode,
  category,
  onSelectMap,
  onRoute,
  compact = false,
}: {
  mode: "link" | "interactive";
  category: string;
  onSelectMap?: () => void;
  onRoute?: () => void;
  compact?: boolean;
}) {
  const rowClass = compact
    ? "flex flex-wrap gap-2"
    : "flex shrink-0 flex-col items-end justify-center gap-3 pl-1 sm:gap-4";

  return (
    <div className={rowClass}>
      <TrendAction
        mode={mode}
        icon={<MapPinIcon className="h-3.5 w-3.5" />}
        label={SEARCH_EXPLORER_CULTURE_CTA}
        hint={SEARCH_EXPLORER_CULTURE_CTA_HINT}
        onClick={onSelectMap}
        pill={compact}
      />
      <TrendAction
        mode={mode}
        icon={<RouteIcon className="h-3.5 w-3.5" />}
        label={SEARCH_EXPLORER_CULTURE_ROUTE}
        hint={culturalPlaceCategoryLabel(category)}
        onClick={onRoute}
        pill={compact}
      />
    </div>
  );
}

function TrendAction({
  mode,
  icon,
  label,
  hint,
  onClick,
  pill = false,
}: {
  mode: "link" | "interactive";
  icon: ReactNode;
  label: string;
  hint: string;
  onClick?: () => void;
  pill?: boolean;
}) {
  if (pill) {
    const pillClass =
      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary/40";

    if (mode === "interactive") {
      return (
        <button type="button" onClick={onClick} className={pillClass} title={hint}>
          {icon}
          {label}
        </button>
      );
    }

    return (
      <Link href="/map" className={pillClass} title={hint}>
        {icon}
        {label}
      </Link>
    );
  }

  const content = (
    <>
      <span className="flex items-center gap-1 text-sm font-semibold text-yunicity-primary group-hover:text-yunicity-primary-hover">
        {icon}
        {label}
      </span>
      <span className="text-[11px] text-neutral-400">{hint}</span>
    </>
  );

  if (mode === "interactive") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex flex-col items-end gap-0.5 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary/40"
      >
        {content}
      </button>
    );
  }

  return (
    <Link href="/map" className="group flex flex-col items-end gap-0.5 text-right">
      {content}
    </Link>
  );
}

function PlaceThumb({ place, compact = false }: { place: CulturalPlaceListItem; compact?: boolean }) {
  const src = resolveCulturalPlaceImageOverride(place) ?? resolveCulturalPlaceThumbnailUrl(place);
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const sizeClass = compact ? "h-16 w-16" : "h-[72px] w-[72px] sm:h-20 sm:w-20";

  if (!showImage) {
    return (
      <div
        className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 via-white to-indigo-50`}
        aria-hidden
      >
        <MonumentIcon className={compact ? "h-5 w-5 text-indigo-300/90" : "h-6 w-6 text-indigo-300/90 sm:h-7 sm:w-7"} />
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClass} shrink-0 overflow-hidden rounded-xl bg-neutral-100`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src!}
        alt={place.image_alt ?? place.name}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

function RouteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 19 9 11l4 3 6-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MonumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 20h12M8 20V9l4-5 4 5v11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12h4" strokeLinecap="round" />
    </svg>
  );
}
