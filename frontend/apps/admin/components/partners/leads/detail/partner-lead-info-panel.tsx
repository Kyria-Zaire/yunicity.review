import { InterestTags } from "@/components/interest-tags";
import type { PartnerLead } from "@yunicity/types";
import {
  PARTNER_LEAD_SOURCE_LABELS,
  organizationTypeLabel,
  partnerLeadNotesEmptyCopy,
  partnerLeadTagsEmptyCopy,
} from "@yunicity/utils";

type PartnerLeadInfoPanelProps = {
  lead: PartnerLead;
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-stone-100 py-3 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="mt-1 text-sm text-stone-900">{value}</dd>
    </div>
  );
}

export function PartnerLeadInfoPanel({ lead }: PartnerLeadInfoPanelProps) {
  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      aria-labelledby="partner-lead-info-title"
    >
      <h2
        id="partner-lead-info-title"
        className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500"
      >
        Informations
      </h2>

      <dl className="mt-3">
        <InfoRow label="Téléphone" value={lead.phone ?? "—"} />
        <InfoRow label="Email" value={lead.email ?? "—"} />
        <InfoRow label="Ville" value={lead.city ?? "—"} />
        <InfoRow
          label="Type"
          value={lead.organization_type ? organizationTypeLabel(lead.organization_type) : "—"}
        />
        <InfoRow label="Source" value={PARTNER_LEAD_SOURCE_LABELS[lead.source]} />
        <InfoRow
          label="Tags"
          value={
            lead.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-stone-400">{partnerLeadTagsEmptyCopy()}</span>
            )
          }
        />
        <InfoRow
          label="Notes"
          value={
            lead.notes?.trim() ? (
              <p className="whitespace-pre-wrap leading-relaxed text-stone-700">{lead.notes}</p>
            ) : (
              <span className="text-stone-400">{partnerLeadNotesEmptyCopy()}</span>
            )
          }
        />
      </dl>

      {(lead.interested_passport ||
        lead.interested_events ||
        lead.interested_offers ||
        lead.interested_creator_program ||
        lead.interested_business_passport) && (
        <div className="mt-4 border-t border-stone-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Intérêts produit
          </p>
          <div className="mt-2">
            <InterestTags lead={lead} />
          </div>
        </div>
      )}
    </section>
  );
}
