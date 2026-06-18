"use client";

import { EventModerationStatusBadge } from "@/components/events/event-moderation-status-badge";
import { EventReadinessBadge } from "@/components/events/event-readiness-badge";
import { EventRejectDialog } from "@/components/events/event-reject-dialog";
import type { AdminLocalEventListItem } from "@yunicity/types";
import {
  buildEventDetailPathWithListContext,
  canAdminApproveEvent,
  canAdminRejectEvent,
  canCancelEvent,
  eventTypeLabel,
  eventVisibilityLabel,
  formatEventDate,
} from "@yunicity/utils";
import { Archive, Check, Eye, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface EventsListProps {
  items: AdminLocalEventListItem[];
  listSearchQuery: URLSearchParams;
  isLoading: boolean;
  error: string | null;
  actionError: string | null;
  moderatingEventId: string | null;
  hasActiveFilters: boolean;
  agendaIsEmpty: boolean;
  onRetry: () => void;
  onResetFilters: () => void;
  onApprove: (eventId: string) => void;
  onReject: (eventId: string, reason: string) => void;
}

function organizationName(event: AdminLocalEventListItem): string {
  return event.organization?.name?.trim() || "—";
}

function zoneLabel(event: AdminLocalEventListItem): string {
  const neighborhood = event.neighborhood_summary?.display_name?.trim();
  if (neighborhood) {
    return neighborhood;
  }
  return event.district?.trim() || event.city;
}

export function EventsList({
  items,
  listSearchQuery,
  isLoading,
  error,
  actionError,
  moderatingEventId,
  hasActiveFilters,
  agendaIsEmpty,
  onRetry,
  onResetFilters,
  onApprove,
  onReject,
}: EventsListProps) {
  const [rejectTarget, setRejectTarget] = useState<AdminLocalEventListItem | null>(null);

  if (isLoading) {
    return <p className="text-sm text-stone-500">Chargement des événements…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        {error}
        <button type="button" onClick={() => void onRetry()} className="ml-3 font-medium underline">
          Réessayer
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    if (!hasActiveFilters && agendaIsEmpty) {
      return (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-stone-900">
            L&apos;agenda territorial est prêt à accueillir ses premiers événements.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Les sorties, rendez-vous associatifs et temps forts de Reims apparaîtront ici dès leur
            intégration.
          </p>
          <Link
            href="/partners"
            className="mt-6 inline-flex rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
          >
            Voir les partenaires
          </Link>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
        <p className="text-lg font-medium text-stone-900">
          Aucun événement ne correspond à ces critères.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Modifiez les filtres ou revenez à l&apos;ensemble de l&apos;agenda.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-6 inline-flex rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
        >
          Réinitialiser les filtres
        </button>
      </div>
    );
  }

  return (
    <>
      {actionError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {actionError}
        </div>
      ) : null}

      <div
        id="events-registry"
        className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Événement</th>
                <th className="px-4 py-3 font-medium">Organisation</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Préparation</th>
                <th className="px-4 py-3 font-medium">Visibilité</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Ville / zone</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((event) => {
                const detailHref = buildEventDetailPathWithListContext(event.id, listSearchQuery);
                const isRowBusy = moderatingEventId === event.id;
                const showApprove = canAdminApproveEvent(
                  event.moderation_status,
                  event.is_cancelled,
                );
                const showReject = canAdminRejectEvent(
                  event.moderation_status,
                  event.is_cancelled,
                );
                const showCancel = canCancelEvent({
                  moderation_status: event.moderation_status,
                  is_cancelled: event.is_cancelled,
                });
                const typeLabel = eventTypeLabel(event.event_type) ?? event.event_type ?? "—";
                const dateLabel = formatEventDate(event.starts_at);

                return (
                  <tr key={event.id} className="hover:bg-stone-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-900">{event.title}</p>
                      {event.description ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">
                          {event.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{organizationName(event)}</td>
                    <td className="px-4 py-3 text-stone-600">{typeLabel}</td>
                    <td className="px-4 py-3">
                      <EventModerationStatusBadge
                        status={event.moderation_status}
                        isCancelled={event.is_cancelled}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {event.readiness ? (
                        <EventReadinessBadge readiness={event.readiness.readiness} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {eventVisibilityLabel("public")}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">{dateLabel}</td>
                    <td className="px-4 py-3 text-xs text-stone-500">{zoneLabel(event)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={detailHref}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                          aria-label={`Ouvrir ${event.title}`}
                        >
                          <Eye className="h-4 w-4" aria-hidden />
                        </Link>
                        {showApprove ? (
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() => void onApprove(event.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                            aria-label={`Approuver ${event.title}`}
                            title="Approuver"
                          >
                            <Check className="h-4 w-4" aria-hidden />
                          </button>
                        ) : null}
                        {showReject ? (
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() => setRejectTarget(event)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                            aria-label={`Rejeter ${event.title}`}
                            title="Rejeter"
                          >
                            <X className="h-4 w-4" aria-hidden />
                          </button>
                        ) : null}
                        {showCancel ? (
                          <Link
                            href={detailHref}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                            aria-label={`Annuler ${event.title}`}
                            title="Annuler"
                          >
                            <Archive className="h-4 w-4" aria-hidden />
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EventRejectDialog
        eventTitle={rejectTarget?.title ?? ""}
        isOpen={rejectTarget !== null}
        isSubmitting={rejectTarget !== null && moderatingEventId === rejectTarget.id}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (!rejectTarget) {
            return;
          }
          onReject(rejectTarget.id, reason);
          setRejectTarget(null);
        }}
      />
    </>
  );
}
