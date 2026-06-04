"use client";

import { EventModerationStatusBadge } from "@/components/events/event-moderation-status-badge";
import type { AdminLocalEventDetail } from "@yunicity/types";
import { buildEventsListBackPath } from "@yunicity/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

interface EventDetailHeaderProps {
  event: AdminLocalEventDetail;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function EventDetailHeader({ event, isRefreshing, onRefresh }: EventDetailHeaderProps) {
  const searchParams = useSearchParams();
  const backHref = useMemo(() => buildEventsListBackPath(searchParams), [searchParams]);

  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
      <div className="space-y-3">
        <Link
          href={backHref}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
        >
          ← Retour aux événements
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{event.title}</h1>
          <p className="mt-1 text-sm text-stone-600">{event.city}</p>
        </div>
        <EventModerationStatusBadge
          status={event.moderation_status}
          isCancelled={event.is_cancelled}
        />
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRefreshing ? "Actualisation…" : "Actualiser"}
      </button>
    </header>
  );
}
