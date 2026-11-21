import type { AdminCockpitAgendaHealth } from "@yunicity/types";
import { CalendarPlus, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { buildCockpitAgendaAlert } from "@/lib/cockpit-agenda-alert";

/**
 * Alerte agenda territorial — RF-03B.
 *
 * Rendue uniquement sous le seuil : un agenda sain ne produit aucune alerte.
 * Le composant ne décide de rien — statut, seuil et libellé viennent du backend
 * (`app.core.territory_agenda_health`), la mise en mots de
 * `buildCockpitAgendaAlert`, testée séparément.
 *
 * Loading et erreur sont gérés en amont par `CockpitPage`, qui n'affiche pas la
 * carte territoriale tant que `signals` n'existe pas : aucune alerte trompeuse
 * ne peut donc apparaître sur des données non chargées.
 */
interface CockpitAgendaAlertProps {
  agendaHealth: AdminCockpitAgendaHealth;
  city: string;
}

export function CockpitAgendaAlert({ agendaHealth, city }: CockpitAgendaAlertProps) {
  const vue = buildCockpitAgendaAlert(agendaHealth, city);
  if (!vue.visible) return null;

  const critique = vue.severite === "critical";
  const ton = critique
    ? "border-red-200 bg-red-50 text-red-900"
    : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div
      role="alert"
      aria-labelledby="cockpit-agenda-alert-title"
      className={`mt-4 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${ton}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <TriangleAlert
          className={`mt-0.5 h-5 w-5 shrink-0 ${critique ? "text-red-600" : "text-amber-600"}`}
          aria-hidden
        />
        <div className="min-w-0">
          <p id="cockpit-agenda-alert-title" className="text-sm font-semibold">
            {vue.titre}
          </p>
          <p className="mt-0.5 text-sm leading-relaxed">{vue.detail}</p>
        </div>
      </div>
      <Link
        href={vue.actionHref}
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-current px-4 py-2 text-sm font-semibold transition hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
      >
        <CalendarPlus className="h-4 w-4" aria-hidden />
        {vue.actionLabel}
      </Link>
    </div>
  );
}
