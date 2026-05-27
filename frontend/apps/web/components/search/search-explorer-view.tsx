"use client";

import { SearchCulturalSection } from "@/components/search/search-cultural-section";
import { SearchExplorerHero } from "@/components/search/search-explorer-hero";
import { SearchLocalTrends } from "@/components/search/search-local-trends";
import { SearchTribesSection } from "@/components/search/search-tribes-section";
import type { SearchExplorerContextState } from "@/hooks/use-search-explorer-context";
import { buildCalmLocalTrends } from "@yunicity/utils";

type SearchExplorerViewProps = {
  explorer: SearchExplorerContextState;
};

export function SearchExplorerView({ explorer }: SearchExplorerViewProps) {
  const trends = buildCalmLocalTrends({
    city: explorer.city,
    neighborhoods: explorer.neighborhoods,
    events: explorer.upcomingEvents,
    culturalPlaces: explorer.culturalPlaces,
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
      <SearchTribesSection tribes={explorer.tribes} city={explorer.city} />
    </div>
  );
}
