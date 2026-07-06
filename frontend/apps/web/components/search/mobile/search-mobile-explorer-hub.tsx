"use client";

import { SearchExplorerOfferHighlight } from "@/components/search/search-explorer-offer-highlight";
import { SearchExplorerTransitRail } from "@/components/search/search-explorer-transit-rail";
import { SearchTribesSection } from "@/components/search/search-tribes-section";
import type { SearchExplorerContextState } from "@/hooks/use-search-explorer-context";
import type { ExplorerCategoryId } from "@yunicity/utils";
import {
  SEARCH_MOBILE_HUB_EMPTY,
  SEARCH_MOBILE_OFFERS_EMPTY,
  SEARCH_MOBILE_STORIES_CTA,
  SEARCH_MOBILE_STORIES_EMPTY,
  SEARCH_MOBILE_TRIBES_EMPTY,
  buildSearchMobileEventRows,
  buildSearchMobileNearbyCards,
  explorerCategoryHref,
  formatSearchMobileLocationLine,
  type SearchMobileCategoryId,
} from "@yunicity/utils";
import Link from "next/link";
import { useMemo } from "react";

import { SearchMobileCulturalSection } from "./search-mobile-cultural-section";
import { SearchMobileEventsList } from "./search-mobile-events-list";
import { SearchMobileHubHero } from "./search-mobile-hub-hero";
import { SearchMobileNearbyRail } from "./search-mobile-nearby-rail";
import { SearchMobileNeighborhoodsSection } from "./search-mobile-neighborhoods-section";
import { SearchMobilePartnersRail } from "./search-mobile-partners-rail";
import { SearchMobileSuggestionsRail } from "./search-mobile-suggestions-rail";

type SearchMobileExplorerHubProps = {
  explorer: SearchExplorerContextState;
  category: SearchMobileCategoryId;
  city: string;
  userCoords: { lat: number; lon: number } | null;
};

function resolveSuggestionsCategory(category: SearchMobileCategoryId): ExplorerCategoryId {
  if (category === "event") return "events";
  return "all";
}

/** Hub Recherche mobile — parité données desktop, layout MOBILE-SEARCH-01. */
export function SearchMobileExplorerHub({
  explorer,
  category,
  city,
  userCoords,
}: SearchMobileExplorerHubProps) {
  const locationLine = useMemo(
    () =>
      formatSearchMobileLocationLine(
        city,
        explorer.neighborhoods[0]?.display_name ?? null,
      ),
    [city, explorer.neighborhoods],
  );

  const nearbyCards = useMemo(
    () =>
      buildSearchMobileNearbyCards({
        places: explorer.catalog,
        city,
        userCoords,
        maxItems: 8,
      }),
    [city, explorer.catalog, userCoords],
  );

  const eventRows = useMemo(
    () =>
      buildSearchMobileEventRows({
        events: explorer.upcomingEvents,
        culturalPlaces: explorer.culturalPlaces,
        maxItems: 5,
      }),
    [explorer.culturalPlaces, explorer.upcomingEvents],
  );

  const suggestions = useMemo(
    () => explorer.suggestionsForCategory(resolveSuggestionsCategory(category)),
    [category, explorer],
  );

  const suggestionsHref = explorerCategoryHref(resolveSuggestionsCategory(category), city);

  if (category === "post") {
    return (
      <div className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-6 text-center">
        <p className="text-sm text-neutral-600">{SEARCH_MOBILE_STORIES_EMPTY}</p>
        <Link
          href={`/videos?city=${encodeURIComponent(city)}`}
          className="mt-3 inline-block text-sm font-semibold text-yunicity-primary"
        >
          {SEARCH_MOBILE_STORIES_CTA} →
        </Link>
      </div>
    );
  }

  if (category === "tribe") {
    if (explorer.tribes.length === 0) {
      return (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
          {SEARCH_MOBILE_TRIBES_EMPTY}
        </p>
      );
    }
    return (
      <SearchTribesSection
        tribes={explorer.tribes}
        city={city}
        title="Tribus locales"
        subtitle="Des cercles de proximité pour sortir, créer et échanger."
        maxItems={6}
        compact
      />
    );
  }

  if (category === "offer") {
    if (!explorer.highlightOffer) {
      return (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
          {SEARCH_MOBILE_OFFERS_EMPTY}
        </p>
      );
    }
    return <SearchExplorerOfferHighlight offer={explorer.highlightOffer} />;
  }

  const showHero = category === "all" || category === "event";
  const showPartners = category === "all";
  const showOffer = category === "all" && explorer.highlightOffer;
  const showNeighborhoods = category === "all";
  const showNearby = category === "all" || category === "organization";
  const showEvents = category === "all" || category === "event";
  const showSuggestions = category === "all" || category === "organization" || category === "event";
  const showTransit = category === "all";
  const showCultural = category === "all" || category === "organization";
  const showTribes = category === "all" && explorer.tribes.length > 0;

  const hasContent =
    showHero ||
    (showPartners && explorer.partners.length > 0) ||
    Boolean(showOffer) ||
    (showNeighborhoods && explorer.neighborhoods.length > 0) ||
    (showNearby && nearbyCards.length > 0) ||
    (showEvents && eventRows.length > 0) ||
    (showSuggestions && suggestions.length > 0) ||
    showTransit ||
    (showCultural && explorer.culturalPlaces.length > 0) ||
    showTribes;

  return (
    <div className="space-y-6">
      {showHero ? (
        <SearchMobileHubHero city={city} heroImageUrl={explorer.heroImageUrl} />
      ) : null}

      {showPartners ? (
        <SearchMobilePartnersRail partners={explorer.partners} city={city} />
      ) : null}

      {showOffer && explorer.highlightOffer ? (
        <SearchExplorerOfferHighlight offer={explorer.highlightOffer} />
      ) : null}

      {showNeighborhoods ? (
        <SearchMobileNeighborhoodsSection neighborhoods={explorer.neighborhoods} city={city} />
      ) : null}

      {showNearby && nearbyCards.length > 0 ? (
        <SearchMobileNearbyRail items={nearbyCards} locationLine={locationLine} />
      ) : null}

      {showEvents && eventRows.length > 0 ? (
        <SearchMobileEventsList
          items={eventRows}
          viewAllHref={`/sortir?city=${encodeURIComponent(city)}`}
        />
      ) : null}

      {showSuggestions && suggestions.length > 0 ? (
        <SearchMobileSuggestionsRail items={suggestions} viewAllHref={suggestionsHref} />
      ) : null}

      {showTransit ? <SearchExplorerTransitRail city={city} /> : null}

      {showCultural ? <SearchMobileCulturalSection places={explorer.culturalPlaces} /> : null}

      {showTribes ? (
        <SearchTribesSection
          tribes={explorer.tribes}
          city={city}
          title="Tribus locales"
          subtitle="Des cercles de proximité pour sortir, créer et échanger."
          maxItems={4}
          compact
        />
      ) : null}

      {!hasContent ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-500">
          {SEARCH_MOBILE_HUB_EMPTY}
        </p>
      ) : null}
    </div>
  );
}
