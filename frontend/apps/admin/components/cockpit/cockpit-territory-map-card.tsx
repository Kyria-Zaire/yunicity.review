import type { AdminCockpitExecutive } from "@yunicity/types";
import { formatAdminMetric } from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

function webMapHref(city: string): string | null {
  const base = (process.env.NEXT_PUBLIC_WEB_APP_URL ?? "").replace(/\/$/, "");
  if (!base) {
    return null;
  }
  return `${base}/map?city=${encodeURIComponent(city)}`;
}

interface CockpitTerritoryMapCardProps {
  city: string;
  executive: AdminCockpitExecutive;
}

const LEGEND = [
  { key: "offers_total" as const, label: "Offres", color: "bg-rose-500" },
  { key: "partners_total" as const, label: "Partenaires", color: "bg-yunicity-primary" },
  { key: "events_total" as const, label: "Événements", color: "bg-amber-500" },
  { key: "partner_leads_total" as const, label: "Leads", color: "bg-emerald-500" },
];

export function CockpitTerritoryMapCard({ city, executive }: CockpitTerritoryMapCardProps) {
  const mapHref = webMapHref(city);

  return (
    <section
      className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm"
      aria-labelledby="cockpit-map-title"
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
        Où se déroule l&apos;activité ?
      </p>
      <div className="mt-0.5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="cockpit-map-title" className="text-sm font-semibold text-stone-900">
            Carte de la ville
          </h2>
          <p className="text-[11px] text-stone-500">Ouverture vers le territoire citoyen</p>
        </div>
        {mapHref ? (
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-yunicity-primary hover:underline"
          >
            Plein écran →
          </a>
        ) : null}
      </div>

      <div
        className={`mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-stone-200 bg-yunicity-surface px-4 text-center ${
          mapHref ? "min-h-[9rem] py-5" : "py-4"
        }`}
      >
        <MapPin className="h-7 w-7 text-stone-300" aria-hidden />
        {mapHref ? (
          <>
            <p className="mt-2 text-sm font-medium text-stone-800">Carte citoyenne disponible</p>
            <p className="mt-1 max-w-xs text-xs text-stone-500">
              Ouvrez la carte web pour explorer les repères réels du territoire {city}.
            </p>
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 rounded-lg bg-yunicity-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-yunicity-primary-hover"
            >
              Ouvrir la carte citoyenne
            </a>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm font-medium text-stone-800">
              Carte citoyenne indisponible sur cet environnement local.
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-stone-500">
              Elle sera accessible automatiquement en recette.
            </p>
            <Link
              href="/partners"
              className="mt-2.5 text-xs font-medium text-yunicity-primary hover:underline"
            >
              Gérer les partenaires en attendant →
            </Link>
          </>
        )}
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-600">
        {LEGEND.map((item) => (
          <li key={item.key} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${item.color}`} />
            {formatAdminMetric(executive[item.key])} {item.label.toLowerCase()}
          </li>
        ))}
      </ul>
    </section>
  );
}
