import type { OrganizationType, PartnerLeadSource, PartnerLeadStatus } from "@yunicity/types";
import { ORGANIZATION_TYPE_OPTIONS, PARTNER_LEAD_SOURCE_LABELS } from "@yunicity/utils";

const STATUS_OPTIONS: { value: "" | PartnerLeadStatus; label: string }[] = [
  { value: "", label: "Tous les statuts" },
  { value: "new", label: "Nouveau" },
  { value: "contacted", label: "Contacté" },
  { value: "interested", label: "Intéressé" },
  { value: "meeting_scheduled", label: "RDV planifié" },
  { value: "signed", label: "Signé" },
  { value: "converted", label: "Converti" },
  { value: "rejected", label: "Refusé" },
  { value: "archived", label: "Archivé" },
];

const SOURCE_OPTIONS = (
  Object.entries(PARTNER_LEAD_SOURCE_LABELS) as [PartnerLeadSource, string][]
).map(([value, label]) => ({ value, label }));

type PartnerLeadsToolbarProps = {
  search: string;
  status: "" | PartnerLeadStatus;
  source: "" | PartnerLeadSource;
  organizationType: "" | OrganizationType;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "" | PartnerLeadStatus) => void;
  onSourceChange: (value: "" | PartnerLeadSource) => void;
  onOrganizationTypeChange: (value: "" | OrganizationType) => void;
  onReset: () => void;
  filtered: boolean;
};

export function PartnerLeadsToolbar({
  search,
  status,
  source,
  organizationType,
  onSearchChange,
  onStatusChange,
  onSourceChange,
  onOrganizationTypeChange,
  onReset,
  filtered,
}: PartnerLeadsToolbarProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm lg:col-span-2">
          <span className="font-medium text-stone-700">Recherche</span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nom ou ville"
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-stone-700">Statut</span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as "" | PartnerLeadStatus)}
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium text-stone-700">Source</span>
          <select
            value={source}
            onChange={(e) => onSourceChange(e.target.value as "" | PartnerLeadSource)}
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Toutes les sources</option>
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium text-stone-700">Type</span>
          <select
            value={organizationType}
            onChange={(e) => onOrganizationTypeChange(e.target.value as "" | OrganizationType)}
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Tous les types</option>
            {ORGANIZATION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filtered ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-3 text-sm font-medium text-yunicity-primary underline"
        >
          Réinitialiser les filtres
        </button>
      ) : null}
    </section>
  );
}
