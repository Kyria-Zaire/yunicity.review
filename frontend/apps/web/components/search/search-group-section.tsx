"use client";

import type { SearchGroupKey, SearchResultGroup } from "@yunicity/types";
import { SEARCH_GROUP_LABELS, SEARCH_LOAD_MORE, SEARCH_RESULT_COUNT } from "@yunicity/utils";

import { SearchResultCard } from "@/components/search/search-result-card";

type SearchGroupSectionProps = {
  groupKey: SearchGroupKey;
  group: SearchResultGroup;
  city: string;
  onLoadMore?: () => void;
  loadingMore?: boolean;
};

export function SearchGroupSection({
  groupKey,
  group,
  city,
  onLoadMore,
  loadingMore = false,
}: SearchGroupSectionProps) {
  if (group.items.length === 0 && group.count === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby={`search-group-${groupKey}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={`search-group-${groupKey}`} className="text-base font-semibold text-neutral-900">
          {SEARCH_GROUP_LABELS[groupKey]}
        </h2>
        <p className="text-xs text-neutral-500">{SEARCH_RESULT_COUNT(group.count)}</p>
      </div>
      <ul className="space-y-2">
        {group.items.map((item) => (
          <li key={item.id}>
            <SearchResultCard item={item} groupKey={groupKey} city={city} />
          </li>
        ))}
      </ul>
      {group.has_more && onLoadMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
        >
          {loadingMore ? "Chargement…" : SEARCH_LOAD_MORE}
        </button>
      ) : null}
    </section>
  );
}
