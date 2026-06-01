"use client";

import {
  neighborhoodVibeLabel,
  neighborhoodVibeTone,
} from "@/components/home/home-neighborhood-vibe";
import { HomeWeekEventsCalendar } from "@/components/home/home-week-events-calendar";
import { SearchCulturalSection } from "@/components/search/search-cultural-section";
import { SearchExplorerHero } from "@/components/search/search-explorer-hero";
import { SearchLocalTrends } from "@/components/search/search-local-trends";
import { SearchTribesSection } from "@/components/search/search-tribes-section";
import type { SearchExplorerContextState } from "@/hooks/use-search-explorer-context";
import type { SearchTypeFilter } from "@yunicity/types";
import {
  HOME_VIEW_ALL_EVENTS,
  SEARCH_TAB_EMPTY_MESSAGES,
  SEARCH_TAB_EXPLORER_SUBTITLES,
  SEARCH_TAB_EXPLORER_TITLES,
  buildLocalTrendItems,
  buildMapEventUrl,
  filterUpcomingEvents,
  formatEventDateRange,
  neighborhoodHref,
} from "@yunicity/utils";
import Link from "next/link";

type SearchTabExplorerProps = {
  explorer: SearchExplorerContextState;
  typeFilter: SearchTypeFilter;
};

const VIBE_CLASS: Record<ReturnType<typeof neighborhoodVibeTone>, string> = {
  active: "bg-yunicity-primary/10 text-yunicity-primary",
  calm: "bg-neutral-100 text-neutral-600",
  discover: "bg-amber-50 text-amber-800",
};

function TabHeader({ typeFilter }: { typeFilter: SearchTypeFilter }) {
  const title = SEARCH_TAB_EXPLORER_TITLES[typeFilter];
  const subtitle = SEARCH_TAB_EXPLORER_SUBTITLES[typeFilter];
  if (typeFilter === "all") return null;

  return (
    <header className="space-y-1">
      <h2 className="text-lg font-bold tracking-tight text-neutral-900">{title}</h2>
      {subtitle ? <p className="text-sm text-neutral-500">{subtitle}</p> : null}
    </header>
  );
}

function EmptyState({ typeFilter }: { typeFilter: SearchTypeFilter }) {
  const message =
    SEARCH_TAB_EMPTY_MESSAGES[typeFilter] ?? "Rien à afficher pour le moment.";
  return (
    <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 px-4 py-6 text-sm text-neutral-500">
      {message}
    </p>
  );
}

function MomentsExplorer({ explorer }: { explorer: SearchExplorerContextState }) {
  const upcoming = filterUpcomingEvents(explorer.upcomingEvents).slice(0, 6);

  return (
    <div className="space-y-6">
      <TabHeader typeFilter="post" />
      <SearchExplorerHero
        events={explorer.upcomingEvents}
        culturalPlaces={[]}
        city={explorer.city}
      />
      {upcoming.length === 0 ? (
        <EmptyState typeFilter="post" />
      ) : (
        <ul className="space-y-2">
          {upcoming.map((event) => (
            <li
              key={event.id}
              className="group flex flex-col gap-0.5 rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 transition hover:border-neutral-300 hover:bg-neutral-50/50"
            >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                  À suivre cette semaine
                </span>
                <span className="font-semibold text-neutral-900 group-hover:text-yunicity-primary">
                  {event.title}
                </span>
                <span className="text-xs text-neutral-500">
                  {formatEventDateRange(event.starts_at, event.ends_at)}
                  {event.location_name ? ` · ${event.location_name}` : null}
                </span>
                <span className="mt-2 inline-flex items-center gap-3 text-xs font-semibold">
                  <Link
                    href={`/events/${event.id}`}
                    className="text-yunicity-primary hover:underline"
                  >
                    Voir le moment
                  </Link>
                  <Link
                    href={buildMapEventUrl(event.id)}
                    className="rounded-full border border-yunicity-primary/25 px-2.5 py-0.5 text-yunicity-primary hover:bg-yunicity-primary/10"
                  >
                    Voir sur la carte
                  </Link>
                </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EventsExplorer({ explorer }: { explorer: SearchExplorerContextState }) {
  const upcoming = filterUpcomingEvents(explorer.upcomingEvents);

  return (
    <div className="space-y-4">
      <TabHeader typeFilter="event" />
      {upcoming.length === 0 ? (
        <EmptyState typeFilter="event" />
      ) : (
        <>
          <HomeWeekEventsCalendar events={upcoming} city={explorer.city} />
          <Link
            href="/events"
            className="inline-block text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {HOME_VIEW_ALL_EVENTS}
          </Link>
        </>
      )}
    </div>
  );
}

function PlacesExplorer({ explorer }: { explorer: SearchExplorerContextState }) {
  return (
    <div className="space-y-4">
      <TabHeader typeFilter="organization" />
      {explorer.culturalPlaces.length === 0 ? (
        <EmptyState typeFilter="organization" />
      ) : (
        <SearchCulturalSection places={explorer.culturalPlaces} />
      )}
    </div>
  );
}

function NeighborhoodsExplorer({ explorer }: { explorer: SearchExplorerContextState }) {
  const { neighborhoods, city } = explorer;

  return (
    <div className="space-y-4">
      <TabHeader typeFilter="neighborhood" />
      {neighborhoods.length === 0 ? (
        <EmptyState typeFilter="neighborhood" />
      ) : (
        <ul className="space-y-2">
          {neighborhoods.map((hood) => {
            const vibe = neighborhoodVibeLabel(hood);
            const tone = neighborhoodVibeTone(vibe);
            return (
              <li key={hood.id}>
                <Link
                  href={neighborhoodHref(hood.slug, city)}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 transition hover:border-neutral-300 hover:bg-neutral-50/50"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 group-hover:text-yunicity-primary">
                      {hood.display_name}
                    </p>
                    {hood.short_description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                        {hood.short_description}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${VIBE_CLASS[tone]}`}
                  >
                    {vibe}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Link
        href={`/neighborhoods?city=${encodeURIComponent(city)}`}
        className="inline-block text-sm font-semibold text-yunicity-primary hover:underline"
      >
        Tous les quartiers
      </Link>
    </div>
  );
}

function TribesExplorer({ explorer }: { explorer: SearchExplorerContextState }) {
  return (
    <div className="space-y-4">
      <TabHeader typeFilter="tribe" />
      <SearchTribesSection
        tribes={explorer.tribes}
        city={explorer.city}
        title="Trouvez votre cercle local"
        subtitle="Des groupes locaux pour agir, sortir, apprendre ou créer ensemble."
        maxItems={6}
      />
    </div>
  );
}

function PassportExplorer({ explorer }: { explorer: SearchExplorerContextState }) {
  const offers = explorer.passportOffers;

  return (
    <div className="space-y-4">
      <TabHeader typeFilter="offer" />
      {offers.length === 0 ? (
        <EmptyState typeFilter="offer" />
      ) : (
        <ul className="space-y-2">
          {offers.map((offer) => (
            <li key={offer.id}>
              <Link
                href="/passport"
                className="group flex flex-col gap-0.5 rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 transition hover:border-neutral-300 hover:bg-neutral-50/50"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                  Privilège local
                </span>
                <span className="font-semibold text-neutral-900 group-hover:text-yunicity-primary">
                  {offer.title}
                </span>
                <span className="text-xs text-neutral-500">{offer.partner.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/passport" className="inline-block text-sm font-semibold text-yunicity-primary hover:underline">
        Ouvrir mon Passport
      </Link>
    </div>
  );
}

function AllExplorer({ explorer }: { explorer: SearchExplorerContextState }) {
  const trends = buildLocalTrendItems({
    city: explorer.city,
    neighborhoods: explorer.neighborhoods,
    events: explorer.upcomingEvents,
    culturalPlaces: explorer.culturalPlaces,
    tribes: explorer.tribes,
    passportOffers: explorer.passportOffers,
  });

  return (
    <div className="space-y-8">
      <SearchExplorerHero
        events={explorer.upcomingEvents}
        culturalPlaces={explorer.culturalPlaces}
        city={explorer.city}
      />
      <SearchLocalTrends items={trends} />
      <SearchCulturalSection places={explorer.culturalPlaces} />
      <SearchTribesSection
        tribes={explorer.tribes}
        city={explorer.city}
        title="Tribus locales"
        subtitle=""
        maxItems={3}
        compact
      />
    </div>
  );
}

export function SearchTabExplorer({ explorer, typeFilter }: SearchTabExplorerProps) {
  switch (typeFilter) {
    case "post":
      return <MomentsExplorer explorer={explorer} />;
    case "event":
      return <EventsExplorer explorer={explorer} />;
    case "organization":
      return <PlacesExplorer explorer={explorer} />;
    case "neighborhood":
      return <NeighborhoodsExplorer explorer={explorer} />;
    case "tribe":
      return <TribesExplorer explorer={explorer} />;
    case "offer":
      return <PassportExplorer explorer={explorer} />;
    case "all":
    default:
      return <AllExplorer explorer={explorer} />;
  }
}
