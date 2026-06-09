"use client";

import { EventModerationStatusBadge } from "@/components/events/event-moderation-status-badge";
import type { AdminLocalEventDetail } from "@yunicity/types";
import { buildEventsListBackPath, eventTemporalStatus, eventTemporalStatusLabel } from "@yunicity/utils";
import { CalendarDays } from "lucide-react";
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
  const temporal = eventTemporalStatus(event.starts_at, event.ends_at);
  const orgLabel = event.organization?.name ?? "Sans organisation";

  return (
    <header className="space-y-5">
      <Link
        href={backHref}
        className="inline-flex text-sm font-medium text-yunicity-ink-muted underline-offset-2 hover:text-yunicity-ink hover:underline"
      >
        ← Retour aux événements
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
            <CalendarDays className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-yunicity-ink-muted">
              Administration · Événement local
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-yunicity-ink">{event.title}</h1>
            <p className="text-sm text-yunicity-ink-muted">
              {orgLabel} · {event.city}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-yunicity-primary px-3 py-1 text-xs font-medium text-white">
                {event.city}
              </span>
              <span className="inline-flex rounded-full border border-yunicity-border bg-yunicity-surface px-3 py-1 text-xs font-medium text-yunicity-ink">
                {eventTemporalStatusLabel(temporal)}
              </span>
              <EventModerationStatusBadge
                status={event.moderation_status}
                isCancelled={event.is_cancelled}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-lg border border-yunicity-border bg-white px-4 py-2 text-sm font-medium text-yunicity-ink shadow-sm transition hover:bg-yunicity-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRefreshing ? "Actualisation…" : "Actualiser"}
        </button>
      </div>
    </header>
  );
}
