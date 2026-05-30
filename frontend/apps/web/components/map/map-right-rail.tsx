"use client";

import { MapCulturalPlacesRail } from "@/components/map/map-cultural-places-rail";
import { MapTransitNearby } from "@/components/map/map-transit-nearby";
import { WebContextPanel } from "@/components/layout/web-context-panel";
import type { MapTransitQueryPoint } from "@/hooks/use-map-transit-nearby";
import type { MapPageContextState } from "@/hooks/use-map-page-context";
import type { CulturalPlaceListItem } from "@yunicity/types";
import {
  MAP_RAIL_AMBIANCE_EMPTY,
  MAP_RAIL_AMBIANCE_TITLE,
  MAP_RAIL_LIVE_EMPTY,
  MAP_RAIL_LIVE_TITLE,
  MAP_RAIL_PASSPORT_AROUND_CTA,
  MAP_RAIL_PASSPORT_AROUND_EMPTY,
  MAP_RAIL_PASSPORT_AROUND_TITLE,
  buildMapLiveDiscoveryItems,
  buildNeighborhoodAmbianceRailItems,
  formatOfferValidUntil,
} from "@yunicity/utils";
import Link from "next/link";
import { CalendarClock, Landmark, MapPinHouse, TicketPercent } from "lucide-react";

function RailSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
      ))}
    </div>
  );
}

type MapRightRailProps = {
  context: MapPageContextState;
  culturalPlaces: CulturalPlaceListItem[];
  transitPoint: MapTransitQueryPoint;
  emphasizeTransit?: boolean;
  selectedCulturalSlug: string | null;
  expandedCulturalSlug: string | null;
  onSelectCulturalPlace: (place: CulturalPlaceListItem) => void;
  onStartRoute: (place: CulturalPlaceListItem) => void;
  onToggleCulturalDetails: (place: CulturalPlaceListItem) => void;
};

export function MapRightRail({
  context,
  culturalPlaces,
  transitPoint,
  emphasizeTransit = false,
  selectedCulturalSlug,
  expandedCulturalSlug,
  onSelectCulturalPlace,
  onStartRoute,
  onToggleCulturalDetails,
}: MapRightRailProps) {
  const { loading, neighborhoods, city, upcomingEvents, passportOffers } = context;
  const liveItems = buildMapLiveDiscoveryItems({
    city,
    events: upcomingEvents,
    culturalPlaces,
    passportOffers,
    neighborhoods,
    maxItems: 5,
  });
  const ambianceItems = buildNeighborhoodAmbianceRailItems(neighborhoods, 3);
  const activeOffers = passportOffers.slice(0, 2);

  if (loading) {
    return <RailSkeleton />;
  }

  return (
    <div className="space-y-4">
      <WebContextPanel title={MAP_RAIL_LIVE_TITLE}>
        {liveItems.length === 0 ? (
          <p className="text-sm text-neutral-500">{MAP_RAIL_LIVE_EMPTY}</p>
        ) : (
          <ul className="space-y-2.5">
            {liveItems.map((item) => (
              <li key={item.id}>
                <div className="group rounded-2xl border border-neutral-200/80 bg-white p-2.5 shadow-sm transition hover:border-neutral-300 hover:shadow-md">
                  <div className="flex items-start gap-2.5">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 text-neutral-700">
                        <LiveItemIcon kind={item.kind} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
                        {item.badge}
                      </span>
                      <p className="mt-1 line-clamp-1 text-sm font-semibold text-neutral-900">
                        {item.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <Link
                      href={item.href}
                      className="inline-flex rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-700 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
                    >
                      {item.ctaLabel}
                    </Link>
                    {item.secondaryHref ? (
                      <Link
                        href={item.secondaryHref}
                        className="inline-flex rounded-full px-2 py-1 text-xs font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/5"
                      >
                        {item.secondaryCtaLabel || "Voir sur la carte"}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </WebContextPanel>

      <WebContextPanel title={MAP_RAIL_AMBIANCE_TITLE}>
        {ambianceItems.length === 0 ? (
          <p className="text-sm text-neutral-500">{MAP_RAIL_AMBIANCE_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {ambianceItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block rounded-xl border border-neutral-200/80 px-3 py-2.5 transition hover:border-yunicity-primary/30 hover:bg-neutral-50/80"
                >
                  <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{item.line}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/neighborhoods?city=${encodeURIComponent(city)}`}
          className="mt-2 inline-block text-xs font-semibold text-yunicity-primary hover:underline"
        >
          Tous les quartiers
        </Link>
      </WebContextPanel>

      <div className={emphasizeTransit ? "ring-2 ring-yunicity-primary/20 rounded-2xl" : undefined}>
        <MapTransitNearby point={transitPoint} />
      </div>

      <MapCulturalPlacesRail
        places={culturalPlaces}
        selectedSlug={selectedCulturalSlug}
        expandedSlug={expandedCulturalSlug}
        onSelectPlace={onSelectCulturalPlace}
        onStartRoute={onStartRoute}
        onToggleDetails={onToggleCulturalDetails}
      />

      {activeOffers.length > 0 ? (
        <WebContextPanel title={MAP_RAIL_PASSPORT_AROUND_TITLE}>
          <ul className="space-y-2">
            {activeOffers.map((offer) => (
              <li key={offer.id}>
                <Link
                  href="/passport"
                  className="flex items-start justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
                >
                  <span className="min-w-0">
                    <span className="block line-clamp-1 text-sm font-medium text-neutral-800">
                      {offer.title}
                    </span>
                    <span className="block text-xs text-neutral-500">{offer.organization.name}</span>
                  </span>
                  <TicketPercent className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/passport"
            className="mt-2 inline-block text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {MAP_RAIL_PASSPORT_AROUND_CTA}
          </Link>
          {activeOffers[0]?.valid_until ? (
            <p className="mt-2 text-[10px] text-neutral-400">
              {formatOfferValidUntil(activeOffers[0].valid_until)}
            </p>
          ) : null}
        </WebContextPanel>
      ) : (
        <p className="px-1 text-xs text-neutral-400">{MAP_RAIL_PASSPORT_AROUND_EMPTY}</p>
      )}
    </div>
  );
}

function LiveItemIcon({ kind }: { kind: "event" | "culture" | "passport" | "neighborhood" }) {
  const className = "h-4 w-4";
  if (kind === "event") return <CalendarClock className={className} aria-hidden="true" />;
  if (kind === "culture") return <Landmark className={className} aria-hidden="true" />;
  if (kind === "passport") return <TicketPercent className={className} aria-hidden="true" />;
  return <MapPinHouse className={className} aria-hidden="true" />;
}
