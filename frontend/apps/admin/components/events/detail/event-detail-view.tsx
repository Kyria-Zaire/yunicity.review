"use client";

import { EventDetailAttentionBanner } from "@/components/events/detail/event-detail-attention-banner";
import { EventDetailAuditSection } from "@/components/events/detail/event-detail-audit-section";
import { EventDetailFeedSyncCard } from "@/components/events/detail/event-detail-feed-sync-card";
import { EventDetailHeader } from "@/components/events/detail/event-detail-header";
import { EventDetailKpiStrip } from "@/components/events/detail/event-detail-kpi-strip";
import { EventDetailLocationCard } from "@/components/events/detail/event-detail-location-card";
import { EventDetailModerationSection } from "@/components/events/detail/event-detail-moderation-section";
import { EventDetailOrganizationCard } from "@/components/events/detail/event-detail-organization-card";
import { EventDetailPreviewCard } from "@/components/events/detail/event-detail-preview-card";
import { EventDetailPublicExposureCard } from "@/components/events/detail/event-detail-public-exposure-card";
import { EventDetailScheduleCard } from "@/components/events/detail/event-detail-schedule-card";
import { useAdminEventActions } from "@/lib/hooks/use-admin-event-actions";
import { useAdminEventDetail } from "@/lib/hooks/use-admin-event-detail";
import { buildEventsListBackPath } from "@yunicity/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface EventDetailViewProps {
  eventId: string;
}

export function EventDetailView({ eventId }: EventDetailViewProps) {
  const searchParams = useSearchParams();
  const backHref = useMemo(() => buildEventsListBackPath(searchParams), [searchParams]);

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
      <div className="mx-auto max-w-6xl space-y-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-yunicity-surface" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-yunicity-surface" />
          ))}
        </div>
        <p className="text-sm text-yunicity-ink-muted">Chargement de la fiche événement…</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Link
          href={backHref}
          className="text-sm font-medium text-yunicity-ink-muted underline-offset-2 hover:underline"
        >
          ← Retour aux événements
        </Link>
        <div className="rounded-xl border border-yunicity-border bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-medium text-yunicity-ink">Événement introuvable</p>
          <p className="mt-2 text-sm text-yunicity-ink-muted">
            L&apos;identifiant <span className="font-mono text-xs">{eventId}</span> ne correspond
            à aucun événement staff.
          </p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Link
          href={backHref}
          className="text-sm font-medium text-yunicity-ink-muted underline-offset-2 hover:underline"
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
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <EventDetailHeader
        event={event}
        isRefreshing={isRefreshing || isModerating}
        onRefresh={() => void handleRefresh()}
      />

      {actionSuccess ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {actionSuccess}
        </div>
      ) : null}

      <EventDetailKpiStrip event={event} />
      <EventDetailAttentionBanner event={event} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <EventDetailPreviewCard event={event} />
          <EventDetailScheduleCard event={event} />
          <EventDetailModerationSection
            event={event}
            isSubmitting={isModerating}
            actionError={actionError}
            onApprove={approveEvent}
            onReject={(reason) => rejectEvent({ reason })}
            onCancel={(reason) => cancelEvent({ reason })}
            onClearActionError={clearActionFeedback}
          />
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

        <aside className="space-y-6">
          <EventDetailOrganizationCard event={event} />
          <EventDetailLocationCard event={event} />
          <EventDetailPublicExposureCard event={event} />
          <EventDetailFeedSyncCard event={event} />
        </aside>
      </div>
    </div>
  );
}
