"use client";

import type { CulturalPlaceDetail, MapEventItem } from "@yunicity/types";
import type { MapTerritorySelection } from "@yunicity/utils";
import {
  MAP_PORTAL_DETAIL_ADD_PLACE,
  MAP_PORTAL_DETAIL_CLOSE,
  MAP_PORTAL_DETAIL_ERROR,
  MAP_PORTAL_DETAIL_HIGHLIGHTS,
  MAP_PORTAL_DETAIL_HIGHLIGHTS_EMPTY,
  MAP_PORTAL_DETAIL_LOADING,
  MAP_PORTAL_DETAIL_ROUTE,
  MAP_PORTAL_DETAIL_SEE_MORE,
  MAP_PORTAL_PARTNER_SEE_PROFILE,
  buildPublicPlaceHref,
  MAP_PORTAL_DETAIL_SHARE,
  MAP_PORTAL_DETAIL_SOURCE,
  MAP_PORTAL_DETAIL_WEBSITE,
  MAP_PORTAL_DISTANCE_AWAY,
  culturalPlaceCategoryLabel,
  haversineMeters,
  mapEventPopupDate,
} from "@yunicity/utils";
import {
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Navigation,
  Plus,
  Share2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

type MapPlaceDetailPanelProps = {
  city: string;
  selection: MapTerritorySelection | null;
  events: MapEventItem[];
  origin: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onStartRoute: (slug: string) => void;
};

export function MapPlaceDetailPanel({
  city,
  selection,
  events,
  origin,
  onClose,
  onStartRoute,
}: MapPlaceDetailPanelProps) {
  const api = useYunicityApi();
  const [placeDetail, setPlaceDetail] = useState<CulturalPlaceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);

  const selectedEvent = useMemo(() => {
    if (!selection || selection.kind !== "event") return null;
    return events.find((event) => event.id === selection.id) ?? null;
  }, [events, selection]);

  useEffect(() => {
    setExpandedDescription(false);
    if (!selection || selection.kind !== "place") {
      setPlaceDetail(null);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    void api
      .getCulturalPlace(selection.slug, city)
      .then((detail) => {
        if (!cancelled) setPlaceDetail(detail);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, city, selection]);

  const nearbyEvents = useMemo(() => {
    if (!placeDetail || !origin) return [];
    return events
      .map((event) => ({
        event,
        distance: haversineMeters(
          placeDetail.latitude,
          placeDetail.longitude,
          event.latitude,
          event.longitude,
        ),
      }))
      .filter((item) => item.distance <= 800)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [events, origin, placeDetail]);

  if (!selection) return null;

  if (selection.kind === "event" && selectedEvent) {
    const distance =
      origin &&
      haversineMeters(
        origin.latitude,
        origin.longitude,
        selectedEvent.latitude,
        selectedEvent.longitude,
      );
    return (
      <PanelShell onClose={onClose}>
        <div className="space-y-4 p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-violet-600">
              Événement
            </p>
            <h2 className="mt-1 text-xl font-bold text-neutral-900">{selectedEvent.title}</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {mapEventPopupDate(selectedEvent)}
            </p>
            {distance != null ? (
              <p className="mt-1 text-sm font-semibold text-yunicity-primary">
                {MAP_PORTAL_DISTANCE_AWAY(distance)}
              </p>
            ) : null}
          </div>
          <p className="text-sm text-neutral-600">{selectedEvent.location_name}</p>
          {selectedEvent.description ? (
            <p className="text-sm leading-relaxed text-neutral-700">{selectedEvent.description}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/events/${selectedEvent.id}`}
              className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Voir l&apos;événement
            </Link>
            <button
              type="button"
              onClick={() => onStartRoute(`event-${selectedEvent.id}`)}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800"
            >
              <Navigation className="h-4 w-4" aria-hidden />
              {MAP_PORTAL_DETAIL_ROUTE}
            </button>
          </div>
        </div>
      </PanelShell>
    );
  }

  if (selection.kind !== "place") return null;

  if (loading) {
    return (
      <PanelShell onClose={onClose}>
        <p className="p-6 text-sm text-neutral-500">{MAP_PORTAL_DETAIL_LOADING}</p>
      </PanelShell>
    );
  }

  if (error || !placeDetail) {
    return (
      <PanelShell onClose={onClose}>
        <p className="p-6 text-sm text-red-700">{MAP_PORTAL_DETAIL_ERROR}</p>
      </PanelShell>
    );
  }

  const heroImage =
    placeDetail.hero_image_url ?? placeDetail.image_url ?? placeDetail.thumbnail_image_url;
  const description =
    placeDetail.description?.trim() ||
    placeDetail.short_description?.trim() ||
    placeDetail.editorial_excerpt?.trim() ||
    "";
  const distance =
    origin &&
    haversineMeters(
      origin.latitude,
      origin.longitude,
      placeDetail.latitude,
      placeDetail.longitude,
    );

  return (
    <PanelShell onClose={onClose}>
      {heroImage ? (
        <div className="relative h-44 bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="space-y-4 p-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">{placeDetail.name}</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {culturalPlaceCategoryLabel(placeDetail.category)}
            {placeDetail.neighborhood
              ? ` • ${placeDetail.neighborhood.display_name}`
              : ""}
          </p>
          <Link
            href={buildPublicPlaceHref(placeDetail.slug, city)}
            className="mt-2 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {MAP_PORTAL_PARTNER_SEE_PROFILE}
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <ActionButton
            primary
            icon={Navigation}
            label={MAP_PORTAL_DETAIL_ROUTE}
            onClick={() => onStartRoute(placeDetail.slug)}
          />
          <ActionButton icon={Globe} label={MAP_PORTAL_DETAIL_WEBSITE} href={placeDetail.source_url} />
          <ActionButton
            icon={Share2}
            label={MAP_PORTAL_DETAIL_SHARE}
            onClick={() => {
              void navigator.clipboard?.writeText(window.location.href);
            }}
          />
          <ActionButton icon={ExternalLink} label="Lieux" href="/places" />
        </div>

        {description ? (
          <div>
            <p className={`text-sm leading-relaxed text-neutral-700 ${expandedDescription ? "" : "line-clamp-3"}`}>
              {description}
            </p>
            {description.length > 140 ? (
              <button
                type="button"
                onClick={() => setExpandedDescription((value) => !value)}
                className="mt-1 text-sm font-semibold text-yunicity-primary hover:underline"
              >
                {MAP_PORTAL_DETAIL_SEE_MORE}
              </button>
            ) : null}
          </div>
        ) : null}

        <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
          <li className="flex items-start gap-3 px-4 py-3 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
            <span className="min-w-0 flex-1 text-neutral-700">{placeDetail.address}</span>
            {distance != null ? (
              <span className="shrink-0 font-semibold text-yunicity-primary">
                {MAP_PORTAL_DISTANCE_AWAY(distance)}
              </span>
            ) : null}
          </li>
          {placeDetail.source_name ? (
            <li className="flex items-center gap-3 px-4 py-3 text-sm text-neutral-700">
              <Clock className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
              <span>Source : {placeDetail.source_name}</span>
            </li>
          ) : null}
          {placeDetail.source_url ? (
            <li className="px-4 py-3">
              <a
                href={placeDetail.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-yunicity-primary hover:underline"
              >
                {MAP_PORTAL_DETAIL_SOURCE}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
          ) : null}
        </ul>

        <section>
          <h3 className="text-sm font-bold text-neutral-900">{MAP_PORTAL_DETAIL_HIGHLIGHTS}</h3>
          {nearbyEvents.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">{MAP_PORTAL_DETAIL_HIGHLIGHTS_EMPTY}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {nearbyEvents.map(({ event, distance: eventDistance }) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2 transition hover:border-yunicity-primary/30"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF0FF] text-yunicity-primary">
                      <Clock className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-neutral-900">
                        {event.title}
                      </span>
                      <span className="block text-xs text-neutral-500">
                        {mapEventPopupDate(event)} •{" "}
                        {MAP_PORTAL_DISTANCE_AWAY(eventDistance)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link
          href="/organizations/request"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-yunicity-primary to-[#5B5CE6] px-4 py-3 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {MAP_PORTAL_DETAIL_ADD_PLACE}
        </Link>
      </div>
    </PanelShell>
  );
}

function PanelShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-lg">
      <div className="flex justify-end p-2">
        <button
          type="button"
          onClick={onClose}
          aria-label={MAP_PORTAL_DETAIL_CLOSE}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {children}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  href,
  primary,
  disabled,
}: {
  icon: typeof Navigation;
  label: string;
  onClick?: () => void;
  href?: string | null;
  primary?: boolean;
  disabled?: boolean;
}) {
  const className = `flex flex-col items-center gap-1 text-[10px] font-semibold ${
    primary ? "text-yunicity-primary" : "text-neutral-600"
  } ${disabled ? "opacity-40 pointer-events-none" : ""}`;

  const iconWrap = (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-full ${
        primary ? "bg-yunicity-primary text-white" : "border border-neutral-200 bg-white"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );

  if (href && !disabled) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {iconWrap}
        {label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {iconWrap}
      {label}
    </button>
  );
}
