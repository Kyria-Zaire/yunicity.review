"use client";

import { LeadStatusBadge } from "@/components/lead-status-badge";
import { formatDate } from "@/lib/format";
import type { PartnerLead } from "@yunicity/types";
import {
  PARTNER_LEAD_SOURCE_LABELS,
  organizationTypeLabel,
} from "@yunicity/utils";
import { ArrowLeft, Pencil, UserPlus } from "lucide-react";
import Link from "next/link";

type PartnerLead360HeroProps = {
  lead: PartnerLead;
  canConvert: boolean;
  convertDisabledReason: string | null;
  onEdit: () => void;
  onConvert: () => void;
};

export function PartnerLead360Hero({
  lead,
  canConvert,
  convertDisabledReason,
  onEdit,
  onConvert,
}: PartnerLead360HeroProps) {
  return (
    <header className="space-y-4">
      <Link
        href="/partner-leads"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-yunicity-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour pipeline
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              Prospect 360°
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
              {lead.name}
            </h1>
            <p className="mt-1.5 text-sm text-stone-600">
              Suivez son parcours jusqu&apos;à son intégration au réseau Yunicity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LeadStatusBadge status={lead.status} />
            {lead.city ? (
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                {lead.city}
              </span>
            ) : null}
            {lead.organization_type ? (
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                {organizationTypeLabel(lead.organization_type)}
              </span>
            ) : null}
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
              {PARTNER_LEAD_SOURCE_LABELS[lead.source]}
            </span>
          </div>

          <p className="text-xs text-stone-500">
            Créé le {formatDate(lead.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Modifier
          </button>
          <button
            type="button"
            onClick={onConvert}
            disabled={!canConvert}
            title={convertDisabledReason ?? undefined}
            aria-disabled={!canConvert}
            className="inline-flex items-center gap-2 rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            Convertir
          </button>
        </div>
      </div>

      {!canConvert && convertDisabledReason ? (
        <p className="text-sm text-amber-800" role="status">
          {convertDisabledReason}
        </p>
      ) : null}
    </header>
  );
}
