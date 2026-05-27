"use client";

import { SearchTabExplorer } from "@/components/search/search-tab-explorer";
import type { SearchExplorerContextState } from "@/hooks/use-search-explorer-context";
import type { SearchTypeFilter } from "@yunicity/types";

type SearchExplorerViewProps = {
  explorer: SearchExplorerContextState;
  typeFilter: SearchTypeFilter;
};

export function SearchExplorerView({ explorer, typeFilter }: SearchExplorerViewProps) {
  return <SearchTabExplorer explorer={explorer} typeFilter={typeFilter} />;
}
