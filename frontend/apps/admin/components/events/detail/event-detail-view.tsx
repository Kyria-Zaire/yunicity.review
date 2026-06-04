"use client";

import { EventDetailAuditSection } from "@/components/events/detail/event-detail-audit-section";
import { EventDetailEngagementCard } from "@/components/events/detail/event-detail-engagement-card";
import { EventDetailHeader } from "@/components/events/detail/event-detail-header";
import { EventDetailIdentityCard } from "@/components/events/detail/event-detail-identity-card";
import { EventDetailLinksSection } from "@/components/events/detail/event-detail-links-section";
import { EventDetailLocationCard } from "@/components/events/detail/event-detail-location-card";
import { EventDetailModerationSection } from "@/components/events/detail/event-detail-moderation-section";
import { EventDetailOrganizationCard } from "@/components/events/detail/event-detail-organization-card";
import { EventDetailScheduleCard } from "@/components/events/detail/event-detail-schedule-card";
import { useAdminEventActions } from "@/lib/hooks/use-admin-event-actions";
import { useAdminEventDetail } from "@/lib/hooks/use-admin-event-detail";
import { buildEventsListPath } from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface EventDetailViewProps {
  eventId: string;
}

export function EventDetailView({ eventId }: EventDetailViewProps) {
  const {
    event,
    isLoading,
    error,
    isNotFound,
    actionError,
    actionSuccess,
    isModerating,
    reload,
    clearActionFeedback,
    approveEvent,
    rejectEvent,
    cancelEvent,
  } = useAdminEventDetail(eventId);

  const detailReady = !isLoading && !isNotFound && !error && !!event;
  const actions = useAdminEventActions(eventId, detailReady);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!actionSuccess) {
      return;
    }
    void actions.reload();
    const timer = window.setTimeout(() => clearActionFeedback(), 5000);
    return () => window.clearTimeout(timer);
  }, [actionSuccess, actions.reload, clearActionFeedback]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    clearActionFeedback();
    try {
      await Promise.all([reload(), actions.reload()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [actions, clearActionFeedback, reload]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 py-8">
        <p className="text-sm text-stone-500">Chargement de la fiche événement…</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Link
          href={buildEventsListPath()}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          ← Retour aux événements
        </Link>
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-medium text-stone-900">Événement introuvable</p>
          <p className="mt-2 text-sm text-stone-500">
            L&apos;identifiant <span className="font-mono text-xs">{eventId}</span> ne correspond
            à aucun événement staff.
          </p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Link
          href={buildEventsListPath()}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          ← Retour aux événements
        </Link>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error ?? "Erreur inconnue."}
          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="ml-3 font-medium underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <EventDetailHeader event={event} isRefreshing={isRefreshing} onRefresh={() => void handleRefresh()} />

      {actionSuccess ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {actionSuccess}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <EventDetailIdentityCard event={event} />
        <EventDetailScheduleCard event={event} />
        <EventDetailLocationCard event={event} />
        <EventDetailOrganizationCard event={event} />
        <EventDetailModerationSection
          event={event}
          isSubmitting={isModerating}
          actionError={actionError}
          onApprove={approveEvent}
          onReject={(reason) => rejectEvent({ reason })}
          onCancel={(reason) => cancelEvent({ reason })}
          onClearActionError={clearActionFeedback}
        />
        <EventDetailEngagementCard event={event} />
      </div>

      <EventDetailLinksSection event={event} />
      <EventDetailAuditSection
        items={actions.items}
        total={actions.total}
        page={actions.page}
        pageSize={actions.pageSize}
        totalPages={actions.totalPages}
        isLoading={actions.isLoading}
        error={actions.error}
        onRetry={actions.reload}
        onPageChange={actions.goToPage}
      />
    </div>
  );
}
