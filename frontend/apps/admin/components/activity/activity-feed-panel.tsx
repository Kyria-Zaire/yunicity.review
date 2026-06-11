import type { AdminActivityFeedItem, AdminActivityFilterCategory } from "@yunicity/types";

import { ActivityCategoryFilter } from "@/components/activity/activity-category-filter";
import { ActivityEmptyState } from "@/components/activity/activity-empty-state";
import { ActivityFeedItemRow } from "@/components/activity/activity-feed-item";

interface ActivityFeedPanelProps {
  items: AdminActivityFeedItem[];
  category: AdminActivityFilterCategory;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onCategoryChange: (category: AdminActivityFilterCategory) => void;
  onLoadMore: () => void;
}

export function ActivityFeedPanel({
  items,
  category,
  isLoading,
  isLoadingMore,
  hasMore,
  onCategoryChange,
  onLoadMore,
}: ActivityFeedPanelProps) {
  return (
    <section className="rounded-2xl border border-[#E7EAF3] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-stone-900">Activité récente</h2>
          <p className="mt-1 text-sm text-stone-600">
            Journal des actions staff et signalements enregistrés.
          </p>
        </div>
        <ActivityCategoryFilter value={category} onChange={onCategoryChange} />
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <ActivityEmptyState />
      ) : (
        <ol className="space-y-4 border-l border-stone-200">
          {items.map((item) => (
            <ActivityFeedItemRow key={item.id} item={item} />
          ))}
        </ol>
      )}

      {hasMore && !isLoading ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
          >
            {isLoadingMore ? "Chargement…" : "Charger plus"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
