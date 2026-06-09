"use client";

import { PartnersPilotMomentum } from "@/components/partners/terrain/partners-pilot-momentum";
import type { AdminPartnersWorkspaceSummary } from "@yunicity/types";
import {
  formatAdminMetric,
  organizationTypeLabel,
  PARTNER_NETWORK_PRIMARY_ACTION_IDS,
  partnerNetworkActionItems,
  partnerNetworkActiveTotal,
  partnerPendingRequestsEmptyCopy,
  partnerPriorityActions,
  shouldShowPartnerEvolutionChart,
} from "@yunicity/utils";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileUp,
  QrCode,
  Search,
  ShieldCheck,
  Tags,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

const ACTION_ICONS: Record<string, LucideIcon> = {
  add: UserPlus,
  verify: ShieldCheck,
  scan: QrCode,
  export: FileUp,
  inactive: Search,
  activation: Tags,
};

const ACTION_TONES: Record<string, string> = {
  add: "text-emerald-700 bg-emerald-50",
  verify: "text-yunicity-primary bg-yunicity-primary-soft",
  scan: "text-sky-700 bg-sky-50",
  export: "text-stone-700 bg-stone-100",
  inactive: "text-amber-700 bg-amber-50",
  activation: "text-violet-700 bg-violet-50",
};

function EvolutionChartSection({ summary }: { summary: AdminPartnersWorkspaceSummary }) {
  const points = summary.evolution_30d;
  const max = Math.max(...points.map((p) => p.cumulative_total), 1);
  const width = 100;
  const height = 48;
  const polyline =
    points.length > 1
      ? points
          .map((point, index) => {
            const x = (index / (points.length - 1)) * width;
            const y = height - (point.cumulative_total / max) * height;
            return `${x},${y}`;
          })
          .join(" ")
      : "";

  const newTotal = points.reduce((sum, p) => sum + p.new_count, 0);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-stone-900">Évolution des partenaires</h3>
        <span className="rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-500">
          30 derniers jours
        </span>
      </div>
      <div className="mt-4 rounded-xl border border-stone-100 bg-stone-50 p-3">
        {points.length > 1 ? (
          <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#2A2FFF"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              points={polyline}
            />
          </svg>
        ) : (
          <p className="py-8 text-center text-sm text-stone-500">
            Les tendances apparaîtront avec les prochaines activations.
          </p>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-stone-500">Nouveaux</p>
          <p className="text-lg font-semibold text-emerald-700">
            {newTotal > 0 ? `+${formatAdminMetric(newTotal)}` : "Prêt pour le pilote"}
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-500">Actifs</p>
          <p className="text-lg font-semibold text-stone-900">
            {partnerNetworkActiveTotal(summary) > 0
              ? formatAdminMetric(partnerNetworkActiveTotal(summary))
              : "À développer"}
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-500">En attente</p>
          <p className="text-lg font-semibold text-stone-900">
            {summary.organizations_pending_review > 0
              ? formatAdminMetric(summary.organizations_pending_review)
              : "Aucune demande"}
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-500">Inactifs</p>
          <p className="text-lg font-semibold text-stone-900">
            {summary.partners_inactive > 0
              ? formatAdminMetric(summary.partners_inactive)
              : "Aucun inactif"}
          </p>
        </div>
      </div>
    </section>
  );
}

function PendingRequests({ summary }: { summary: AdminPartnersWorkspaceSummary }) {
  const count = summary.organizations_pending_review;
  const emptyCopy = partnerPendingRequestsEmptyCopy();

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">
        Demandes en attente ({formatAdminMetric(count)})
      </h3>
      <ul className="mt-3 space-y-3">
        {summary.pending_requests.length === 0 ? (
          <li className="space-y-1">
            <p className="text-sm font-medium text-stone-800">{emptyCopy.title}</p>
            <p className="text-xs leading-relaxed text-stone-500">{emptyCopy.message}</p>
          </li>
        ) : (
          summary.pending_requests.map((request) => (
            <li
              key={request.organization_id}
              className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-stone-900">{request.name}</p>
                <p className="text-xs text-stone-500">
                  {organizationTypeLabel(
                    request.organization_type as Parameters<typeof organizationTypeLabel>[0],
                  )}{" "}
                  · Demandé le{" "}
                  {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                    new Date(request.requested_at),
                  )}
                </p>
              </div>
              <Link
                href={`/partners?tab=verification&organization_id=${request.organization_id}`}
                className="shrink-0 rounded-lg bg-yunicity-primary px-3 py-1.5 text-xs font-medium text-white"
              >
                Examiner
              </Link>
            </li>
          ))
        )}
      </ul>
      {count > 0 ? (
        <Link
          href="/partners?tab=verification"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-yunicity-primary"
        >
          Voir toutes les demandes
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </section>
  );
}

function ActionRow({
  action,
}: {
  action: ReturnType<typeof partnerNetworkActionItems>[number];
}) {
  const Icon = ACTION_ICONS[action.id] ?? UserPlus;
  const tone = ACTION_TONES[action.id] ?? "text-stone-700 bg-stone-100";

  return (
    <li>
      <Link
        href={action.href}
        className="flex items-center gap-3 rounded-xl border border-stone-100 px-3 py-2.5 hover:bg-stone-50"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <p className="text-sm font-medium text-stone-900">{action.label}</p>
          <p className="text-xs text-stone-500">{action.description}</p>
        </span>
      </Link>
    </li>
  );
}

function NetworkActions({ summary }: { summary: AdminPartnersWorkspaceSummary }) {
  const [expanded, setExpanded] = useState(false);
  const allActions = partnerNetworkActionItems(summary);
  const primarySet = new Set<string>(PARTNER_NETWORK_PRIMARY_ACTION_IDS);
  const primary = allActions.filter((a) => primarySet.has(a.id));
  const secondary = allActions.filter((a) => !primarySet.has(a.id));
  const priorityCount = partnerPriorityActions(summary).length;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">Actions réseau</h3>
      <ul className="mt-3 space-y-2">
        {primary.map((action) => (
          <ActionRow key={action.id} action={action} />
        ))}
        {expanded
          ? secondary.map((action) => <ActionRow key={action.id} action={action} />)
          : null}
      </ul>
      {secondary.length > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-yunicity-primary hover:underline"
        >
          {expanded ? (
            <>
              Réduire les actions
              <ChevronUp className="h-4 w-4" aria-hidden />
            </>
          ) : (
            <>
              Voir toutes les actions
              <ChevronDown className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      ) : null}
      {priorityCount > 0 ? (
        <p className="mt-3 text-xs text-stone-500">
          {priorityCount} action{priorityCount > 1 ? "s" : ""} prioritaire
          {priorityCount > 1 ? "s" : ""} à traiter.
        </p>
      ) : null}
    </section>
  );
}

export function PartnersTerrainBottomGrid({ summary }: { summary: AdminPartnersWorkspaceSummary }) {
  const showChart = shouldShowPartnerEvolutionChart(summary);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <PendingRequests summary={summary} />
      {showChart ? (
        <EvolutionChartSection summary={summary} />
      ) : (
        <PartnersPilotMomentum summary={summary} />
      )}
      <NetworkActions summary={summary} />
    </div>
  );
}
