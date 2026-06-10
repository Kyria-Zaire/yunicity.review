import { AnalyticsChartCard } from "@/components/analytics/analytics-chart-card";

export function AnalyticsEvolutionPanel() {
  return (
    <AnalyticsChartCard title="Évolution de l'activité">
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50 px-6 text-center">
        <p className="text-sm font-semibold text-stone-800">
          Historique détaillé indisponible pour cette période.
        </p>
        <p className="mt-2 max-w-md text-sm text-stone-500">
          Les tendances journalières seront disponibles après activation du suivi quotidien côté
          backend. Aucune courbe fictive n&apos;est affichée.
        </p>
      </div>
    </AnalyticsChartCard>
  );
}
