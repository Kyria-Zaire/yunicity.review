"use client";

import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import { EventDetailCard } from "@/components/events/detail/event-detail-card";
import type { AdminLocalEventActionItem } from "@yunicity/types";
import {
  eventAdminActionLabel,
  formatEventAdminActionStatusTransition,
  formatEventDate,
} from "@yunicity/utils";
import { CheckCircle2, XCircle, Ban } from "lucide-react";

interface EventDetailAuditSectionProps {
  items: AdminLocalEventActionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

function actorLabel(item: AdminLocalEventActionItem): string {
  const actor = item.actor_user;
  if (actor.display_name?.trim()) {
    return actor.display_name;
  }
  return actor.email;
}

function actionIcon(action: AdminLocalEventActionItem["action"]) {
  switch (action) {
    case "approve":
      return CheckCircle2;
    case "reject":
      return XCircle;
    case "cancel":
      return Ban;
    default:
      return CheckCircle2;
  }
}

function actionTone(action: AdminLocalEventActionItem["action"]): string {
  switch (action) {
    case "approve":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "reject":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "cancel":
      return "bg-stone-100 text-stone-700 border-stone-200";
    default:
      return "bg-yunicity-surface text-yunicity-ink-muted border-yunicity-border";
  }
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function EventDetailAuditSection({
  items,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  error,
  onRetry,
  onPageChange,
}: EventDetailAuditSectionProps) {
  return (
    <EventDetailCard
      title="Activité staff"
      subtitle="Historique des actions de modération sur cet événement"
    >
      {isLoading ? (
        <p className="text-sm text-yunicity-ink-muted">Chargement de l&apos;historique…</p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
          <button type="button" onClick={() => void onRetry()} className="ml-3 font-medium underline">
            Réessayer
          </button>
        </div>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-yunicity-border bg-yunicity-surface px-6 py-10 text-center">
          <p className="text-sm font-medium text-yunicity-ink">Aucune action staff enregistrée.</p>
          <p className="mt-2 text-sm text-yunicity-ink-muted">
            Les approbations, refus et annulations apparaîtront ici.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <div className="space-y-4">
          <ol className="relative space-y-0">
            {items.map((item, index) => {
              const Icon = actionIcon(item.action);
              const isLast = index === items.length - 1;
              return (
                <li key={item.id} className="relative flex gap-4 pb-6">
                  {!isLast ? (
                    <span
                      className="absolute left-[1.125rem] top-10 h-[calc(100%-1.5rem)] w-px bg-yunicity-border"
                      aria-hidden
                    />
                  ) : null}
                  <span className="w-12 shrink-0 pt-0.5 text-right text-xs tabular-nums text-yunicity-ink-muted">
                    {formatTime(item.created_at)}
                  </span>
                  <span
                    className={`relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${actionTone(item.action)}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-yunicity-ink">
                          {eventAdminActionLabel(item.action)}
                        </p>
                        <p className="mt-0.5 text-xs text-yunicity-ink-muted">
                          {actorLabel(item)} ·{" "}
                          {formatEventAdminActionStatusTransition(
                            item.previous_status,
                            item.new_status,
                          )}
                        </p>
                        {item.reason ? (
                          <p className="mt-1 text-sm text-yunicity-ink-muted">{item.reason}</p>
                        ) : null}
                      </div>
                      <span className="text-xs text-yunicity-ink-muted">
                        {formatEventDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <PassportOpsPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            isLoading={isLoading}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}
    </EventDetailCard>
  );
}
