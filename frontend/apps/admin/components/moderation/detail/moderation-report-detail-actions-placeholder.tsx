export function ModerationReportDetailActionsPlaceholder() {
  return (
    <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Actions</h2>
      <p className="mt-3 text-sm text-stone-700">
        <span className="font-medium">Resolve</span> / <span className="font-medium">Dismiss</span>{" "}
        prévus en <span className="font-medium">ADMIN-07D</span>.
      </p>
      <p className="mt-2 text-xs text-stone-500">
        Aucune action de modération n&apos;est disponible sur cette fiche en lecture seule.
      </p>
    </section>
  );
}
