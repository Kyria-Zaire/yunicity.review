export function AnalyticsEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center">
      <p className="text-sm font-medium text-stone-700">Aucune activité territoriale enregistrée</p>
      <p className="mt-1 text-xs text-stone-500">
        Les indicateurs apparaîtront dès que des citoyens, partenaires et contenus seront actifs
        sur le territoire pilote.
      </p>
    </div>
  );
}
