"use client";

import { ActivityAlertsPanel } from "@/components/activity/activity-alerts-panel";
import { ActivityErrorState } from "@/components/activity/activity-error-state";
import { ActivityFeedPanel } from "@/components/activity/activity-feed-panel";
import { ActivityHeader } from "@/components/activity/activity-header";
import { ActivityHealthCard } from "@/components/activity/activity-health-card";
import { ActivityLoadingState } from "@/components/activity/activity-loading-state";
import { ActivitySummaryCards } from "@/components/activity/activity-summary-cards";
import { useAdminActivity } from "@/lib/hooks/use-admin-activity";

export function ActivityPage() {
  const {
    summary,
    feed,
    category,
    setCategory,
    isLoadingSummary,
    isLoadingFeed,
    isLoadingMore,
    error,
    reload,
    loadMore,
    hasMore,
  } = useAdminActivity();

  if (isLoadingSummary && !summary) {
    return <ActivityLoadingState />;
  }

  if (error && !summary) {
    return <ActivityErrorState message={error} onRetry={() => void reload()} />;
  }

  if (!summary) {
    return (
      <ActivityErrorState
        message="Aucune donnée d'activité disponible."
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ActivityHeader generatedAt={summary.generated_at} />
        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Actualiser
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      <ActivitySummaryCards summary={summary} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <ActivityAlertsPanel alerts={summary.alerts} />
          <ActivityHealthCard health={summary.health} />
        </div>
        <ActivityFeedPanel
          items={feed?.items ?? []}
          category={category}
          isLoading={isLoadingFeed}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onCategoryChange={setCategory}
          onLoadMore={() => void loadMore()}
        />
      </div>
    </div>
  );
}
