"use client";

import { EventModerationStatusBadge } from "@/components/events/event-moderation-status-badge";
import { EventRejectDialog } from "@/components/events/event-reject-dialog";
import { formatDateTime } from "@/lib/format";
import type { AdminLocalEventListItem } from "@yunicity/types";
import {
  buildEventDetailPathWithListContext,
  canAdminApproveEvent,
  canAdminRejectEvent,
  eventVisibilityLabel,
  formatEventDate,
} from "@yunicity/utils";
import Link from "next/link";
import { useState } from "react";

interface EventsListProps {
  items: AdminLocalEventListItem[];
  listSearchQuery: URLSearchParams;
  isLoading: boolean;
  error: string | null;
  actionError: string | null;
  moderatingEventId: string | null;
  onRetry: () => void;
  onApprove: (eventId: string) => void;
  onReject: (eventId: string, reason: string) => void;
}

function organizationName(event: AdminLocalEventListItem): string {
  return event.organization?.name?.trim() || "—";
}

export function EventsList({
  items,
  listSearchQuery,
  isLoading,
  error,
  actionError,
  moderatingEventId,
  onRetry,
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
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-stone-900">Aucun événement pour ce filtre</p>
        <p className="mt-2 text-sm text-stone-500">
          Ajustez le statut ou la ville, ou revenez plus tard.
        </p>
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

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Titre</th>
                <th className="px-4 py-3 font-medium">Organisation</th>
                <th className="px-4 py-3 font-medium">Ville</th>
                <th className="px-4 py-3 font-medium">Modération</th>
                <th className="px-4 py-3 font-medium">Visibilité</th>
                <th className="px-4 py-3 font-medium">Début</th>
                <th className="px-4 py-3 font-medium">Fin</th>
                <th className="px-4 py-3 font-medium">Créé le</th>
                <th className="px-4 py-3 font-medium">Intérêts</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((event) => {
                const isRowBusy = moderatingEventId === event.id;
                const showApprove = canAdminApproveEvent(event.moderation_status);
                const showReject = canAdminRejectEvent(event.moderation_status);
                const interestCount = event.interest_count ?? 0;

                return (
                  <tr key={event.id} className="hover:bg-stone-50/80">
                    <td className="px-4 py-3 font-medium text-stone-900">{event.title}</td>
                    <td className="px-4 py-3 text-stone-700">{organizationName(event)}</td>
                    <td className="px-4 py-3 text-stone-600">{event.city}</td>
                    <td className="px-4 py-3">
                      <EventModerationStatusBadge
                        status={event.moderation_status}
                        isCancelled={event.is_cancelled}
                      />
                    </td>
                    <td className="px-4 py-3 text-stone-600">{eventVisibilityLabel("public")}</td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {formatEventDate(event.starts_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {formatEventDate(event.ends_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {formatDateTime(event.created_at)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-stone-700">
                      {interestCount > 0 ? interestCount : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={buildEventDetailPathWithListContext(event.id, listSearchQuery)}
                          className="text-sm font-medium text-stone-800 underline-offset-2 hover:underline"
                          title="Fiche détaillée — ADMIN-05C"
                        >
                          Voir
                        </Link>
                        {showApprove ? (
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() => void onApprove(event.id)}
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            Approuver
                          </button>
                        ) : null}
                        {showReject ? (
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() => setRejectTarget(event)}
                            className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-900 hover:bg-rose-100 disabled:opacity-50"
                          >
                            Refuser
                          </button>
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
