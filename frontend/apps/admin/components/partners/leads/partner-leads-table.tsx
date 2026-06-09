import { LeadStatusBadge } from "@/components/lead-status-badge";
import { formatDate } from "@/lib/format";
import type { PartnerLead } from "@yunicity/types";
import { PARTNER_LEAD_SOURCE_LABELS, organizationTypeLabel } from "@yunicity/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

function formatFollowup(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return formatDate(iso);
}

function lastActivity(lead: PartnerLead): string {
  if (lead.last_contacted_at) {
    return formatDate(lead.last_contacted_at);
  }
  return formatDate(lead.updated_at);
}

function primaryActionLabel(status: PartnerLead["status"]): string {
  switch (status) {
    case "new":
      return "Contacter";
    case "contacted":
      return "Qualifier";
    case "interested":
    case "meeting_scheduled":
      return "Avancer";
    case "signed":
      return "Convertir";
    case "converted":
      return "Voir";
    default:
      return "Ouvrir";
  }
}

type PartnerLeadsTableProps = {
  items: PartnerLead[];
  isLoading: boolean;
};

export function PartnerLeadsTable({ items, isLoading }: PartnerLeadsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm" aria-busy="true">
        <p className="text-sm text-stone-500">Chargement des prospects…</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Prospect</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Territoire</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Prochaine relance</th>
              <th className="px-4 py-3 font-medium">Dernière activité</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((lead) => (
              <tr key={lead.id} className="hover:bg-stone-50/80">
                <td className="px-4 py-3">
                  <Link
                    href={`/partner-leads/${lead.id}`}
                    className="font-medium text-stone-900 hover:underline"
                  >
                    {lead.name}
                  </Link>
                  {lead.contact_name ? (
                    <p className="mt-0.5 text-xs text-stone-500">{lead.contact_name}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {lead.organization_type
                    ? organizationTypeLabel(lead.organization_type)
                    : "—"}
                </td>
                <td className="px-4 py-3 text-stone-500">{lead.city ?? "—"}</td>
                <td className="px-4 py-3">
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3 text-stone-500">
                  {PARTNER_LEAD_SOURCE_LABELS[lead.source]}
                </td>
                <td className="px-4 py-3 text-stone-500">{formatFollowup(lead.next_followup_at)}</td>
                <td className="px-4 py-3 text-stone-500">{lastActivity(lead)}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/partner-leads/${lead.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-yunicity-primary hover:underline"
                  >
                    {primaryActionLabel(lead.status)}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
