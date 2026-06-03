import type { AdminCockpitExecutive } from "@yunicity/types";

import { CockpitMetricCard } from "./cockpit-metric-card";

const EXECUTIVE_ITEMS: { key: keyof AdminCockpitExecutive; label: string }[] = [
  { key: "users_total", label: "Citoyens" },
  { key: "passports_total", label: "Passports" },
  { key: "partners_total", label: "Partenaires" },
  { key: "offers_total", label: "Offres" },
  { key: "events_total", label: "Événements" },
  { key: "creator_contents_total", label: "Créateurs" },
  { key: "partner_leads_total", label: "Leads" },
];

export function CockpitExecutiveOverview({ executive }: { executive: AdminCockpitExecutive }) {
  return (
    <section aria-labelledby="cockpit-executive-title">
      <h2 id="cockpit-executive-title" className="text-sm font-semibold text-stone-900">
        Vue d&apos;ensemble
      </h2>
      <p className="mt-1 text-xs text-stone-500">
        {executive.users_active} citoyens actifs sur {executive.users_total} comptes
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {EXECUTIVE_ITEMS.map((item) => (
          <CockpitMetricCard
            key={item.key}
            label={item.label}
            value={executive[item.key]}
            hint={item.key === "users_total" ? "Territoire global" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
