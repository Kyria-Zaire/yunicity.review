"use client";

import type { AdminStaffActionItem } from "@yunicity/types";
import {
  formatStaffDate,
  staffActionLabel,
} from "@yunicity/utils";

interface StaffDetailAuditSummaryCardProps {
  totalActions: number;
  latestAction: AdminStaffActionItem | null;
  isLoading: boolean;
}

function actorLabel(action: AdminStaffActionItem | null): string {
  if (!action?.actor_user) {
    return "—";
  }
  return action.actor_user.display_name?.trim() || action.actor_user.email;
}

export function StaffDetailAuditSummaryCard({
  totalActions,
  latestAction,
  isLoading,
}: StaffDetailAuditSummaryCardProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Synthèse audit
      </h2>
      {isLoading ? (
        <p className="mt-4 text-sm text-stone-500">Chargement de l&apos;historique…</p>
      ) : (
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-stone-500">Actions enregistrées</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">
              {totalActions}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500">Dernière action</dt>
            <dd className="mt-1 text-sm text-stone-900">
              {latestAction ? staffActionLabel(latestAction.action) : "—"}
            </dd>
            {latestAction ? (
              <dd className="mt-0.5 text-xs text-stone-500">
                {formatStaffDate(latestAction.created_at)}
              </dd>
            ) : null}
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500">Dernier acteur</dt>
            <dd className="mt-1 text-sm text-stone-900">{actorLabel(latestAction)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
