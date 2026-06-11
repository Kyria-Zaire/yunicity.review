"use client";

import Link from "next/link";

import { ActivitySeverityBadge } from "@/components/activity/activity-severity-badge";
import {
  activityCategoryLabel,
  activityFeedSeverityLabel,
  formatCockpitActivityTime,
} from "@/lib/activity-display";
import { useCockpitRecentActivity } from "@/lib/hooks/use-cockpit-recent-activity";

export function CockpitRecentActivity() {
  const { items, isLoading, error } = useCockpitRecentActivity();

  return (
    <section
      aria-labelledby="cockpit-recent-activity-title"
      className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3">
        <h2 id="cockpit-recent-activity-title" className="text-sm font-semibold text-stone-900">
          Activité récente
        </h2>
        <p className="mt-0.5 text-xs text-stone-500">
          Dernières actions staff et signalements enregistrés.
        </p>
      </div>

      {isLoading ? (
        <ul className="space-y-2" aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className="h-14 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </ul>
      ) : null}

      {error && !isLoading ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <p className="text-sm text-stone-500">Aucune activité récente enregistrée.</p>
      ) : null}

      {!isLoading && items.length > 0 ? (
        <ul className="divide-y divide-stone-100">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex flex-wrap items-start justify-between gap-2 py-3 transition-colors hover:bg-stone-50/80"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium tabular-nums text-stone-500">
                    {formatCockpitActivityTime(item.created_at)}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-stone-900">{item.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-stone-600">{item.description}</p>
                  <p className="mt-1 text-[11px] text-stone-500">
                    {activityCategoryLabel(item.category)} ·{" "}
                    {activityFeedSeverityLabel(item.severity).toLowerCase()}
                  </p>
                </div>
                <ActivitySeverityBadge
                  variant="feed"
                  severity={item.severity}
                  label={activityFeedSeverityLabel(item.severity)}
                  className="shrink-0"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 border-t border-stone-100 pt-3">
        <Link
          href="/activity"
          className="text-sm font-medium text-yunicity-primary hover:underline"
        >
          Voir toute l&apos;activité →
        </Link>
      </div>
    </section>
  );
}
