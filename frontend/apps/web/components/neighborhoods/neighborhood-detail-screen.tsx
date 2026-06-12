"use client";

import { NeighborhoodDetailAboutSection } from "@/components/neighborhoods/neighborhood-detail-about-section";
import { NeighborhoodDetailBreadcrumbs } from "@/components/neighborhoods/neighborhood-detail-breadcrumbs";
import { NeighborhoodDetailLocationCard } from "@/components/neighborhoods/neighborhood-detail-location-card";
import { NeighborhoodDetailMoments } from "@/components/neighborhoods/neighborhood-detail-moments";
import { NeighborhoodDetailPlacesRail } from "@/components/neighborhoods/neighborhood-detail-places-rail";
import { NeighborhoodDetailPortalHero } from "@/components/neighborhoods/neighborhood-detail-portal-hero";
import { NeighborhoodDetailPracticalCard } from "@/components/neighborhoods/neighborhood-detail-practical-card";
import { NeighborhoodDetailRightRail } from "@/components/neighborhoods/neighborhood-detail-right-rail";
import { NeighborhoodDetailTabs } from "@/components/neighborhoods/neighborhood-detail-tabs";
import { NeighborhoodsAppShell } from "@/components/neighborhoods/neighborhoods-app-shell";
import { useNeighborhoodDetailContext } from "@/hooks/use-neighborhood-detail-context";
import {
  NEIGHBORHOOD_DETAIL_LOADING,
  NEIGHBORHOOD_DETAIL_RETRY,
  NEIGHBORHOOD_DETAIL_TABS,
  NEIGHBORHOOD_NOT_FOUND,
  buildNeighborhoodDetailBriefFacts,
  buildNeighborhoodDetailBreadcrumbs,
  buildNeighborhoodDetailPlaceCards,
  buildNeighborhoodDetailQuickStats,
  neighborhoodHref,
  resolveNeighborhoodPracticalAddress,
  resolveNeighborhoodPresentationText,
} from "@yunicity/utils";
import { useMemo } from "react";

export function NeighborhoodDetailScreen({ slug, city }: { slug: string; city: string }) {
  const context = useNeighborhoodDetailContext(slug, city);
  const hood = context.hood;

  const breadcrumbs = useMemo(
    () => (hood ? buildNeighborhoodDetailBreadcrumbs(hood) : []),
    [hood],
  );

  const eventsCount = context.upcomingEvents.length;
  const organizationsCount = context.context?.organizations?.length ?? 0;

  const quickStats = useMemo(
    () => (hood ? buildNeighborhoodDetailQuickStats(hood, eventsCount) : []),
    [eventsCount, hood],
  );

  const briefFacts = useMemo(
    () =>
      hood
        ? buildNeighborhoodDetailBriefFacts({
            hood,
            eventsCount,
            placesCount: context.hoodCulturalPlaces.length,
            organizationsCount,
            tribesCount: context.tribes.length,
          })
        : [],
    [context.hoodCulturalPlaces.length, context.tribes.length, eventsCount, hood, organizationsCount],
  );

  const placeCards = useMemo(
    () =>
      hood ? buildNeighborhoodDetailPlaceCards(context.hoodCulturalPlaces, context.city) : [],
    [context.city, context.hoodCulturalPlaces, hood],
  );

  const presentation = useMemo(
    () => (hood ? resolveNeighborhoodPresentationText(hood) : null),
    [hood],
  );

  const practicalAddress = useMemo(
    () => (hood ? resolveNeighborhoodPracticalAddress(hood, context.hoodCulturalPlaces) : ""),
    [context.hoodCulturalPlaces, hood],
  );

  async function shareNeighborhood() {
    if (!hood) return;
    const url = `${window.location.origin}${neighborhoodHref(hood.slug, hood.city)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: hood.display_name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      /* annulation ou refus */
    }
  }

  if (context.loading) {
    return (
      <NeighborhoodsAppShell>
        <p className="px-3 py-12 text-center text-sm text-neutral-500">{NEIGHBORHOOD_DETAIL_LOADING}</p>
      </NeighborhoodsAppShell>
    );
  }

  if (context.error || !hood) {
    return (
      <NeighborhoodsAppShell>
        <div className="mx-auto max-w-lg px-3 py-12 text-center">
          <p className="text-sm text-red-800">{NEIGHBORHOOD_NOT_FOUND}</p>
          <button
            type="button"
            onClick={() => void context.reload()}
            className="mt-4 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {NEIGHBORHOOD_DETAIL_RETRY}
          </button>
        </div>
      </NeighborhoodsAppShell>
    );
  }

  return (
    <NeighborhoodsAppShell>
      <div className="mx-auto w-full max-w-[1400px] px-3 pb-12 sm:px-4 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="min-w-0 space-y-6">
            <NeighborhoodDetailBreadcrumbs items={breadcrumbs} />

            <NeighborhoodDetailPortalHero hood={hood} quickStats={quickStats} />

            <NeighborhoodDetailTabs tabs={NEIGHBORHOOD_DETAIL_TABS} onShare={() => void shareNeighborhood()} />

            <NeighborhoodDetailAboutSection presentation={presentation} briefFacts={briefFacts} />

            <NeighborhoodDetailPlacesRail cards={placeCards} city={context.city} hoodSlug={hood.slug} />

            <NeighborhoodDetailMoments
              events={context.upcomingEvents}
              culturalPlaces={context.cityCulturalPlaces}
            />

            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              <NeighborhoodDetailLocationCard hood={hood} places={context.hoodCulturalPlaces} />
              <NeighborhoodDetailPracticalCard
                hood={hood}
                address={practicalAddress}
                city={context.city}
              />
            </div>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <NeighborhoodDetailRightRail
              context={context}
              hood={hood}
              weatherLat={hood.latitude}
              weatherLon={hood.longitude}
            />
          </aside>
        </div>
      </div>
    </NeighborhoodsAppShell>
  );
}
