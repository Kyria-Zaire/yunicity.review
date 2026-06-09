import type { PartnersWorkspaceTabId } from "@/lib/partners-workspace";
import Link from "next/link";

export function PartnersTerritorialHeader({
  city,
  onNavigateTab,
}: {
  city: string;
  onNavigateTab: (tab: PartnersWorkspaceTabId) => void;
}) {
  return (
    <header className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
          Pilotage territorial
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
          Réseau partenaires
        </h1>
        <p className="mt-2 text-sm font-medium text-stone-700 sm:text-base">
          Développez le réseau local Yunicity à {city}.
        </p>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-600">
          Suivez les commerces, associations et organisations depuis le premier contact
          jusqu&apos;à l&apos;activation.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onNavigateTab("leads")}
          className="rounded-lg bg-yunicity-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
        >
          Voir les prospects
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab("partners")}
          className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50"
        >
          Voir le réseau actif
        </button>
        <Link
          href="/partner-leads"
          className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50"
        >
          Ouvrir le CRM terrain
        </Link>
      </div>
    </header>
  );
}
