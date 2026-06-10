import type { PassportOpsIntelligenceResult } from "@yunicity/utils";
import { formatAdminMetric, passportOpsIntelligenceEmptyCopy } from "@yunicity/utils";

export function PassportOpsIntelligence({
  intelligence,
}: {
  intelligence: PassportOpsIntelligenceResult;
}) {
  const emptyCopy = passportOpsIntelligenceEmptyCopy();

  if (!intelligence.hasData || !intelligence.topPartner) {
    return (
      <section className="rounded-xl border border-dashed border-stone-200 bg-stone-50/30 px-4 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
          {emptyCopy.title}
        </p>
        <p className="mt-3 text-sm text-stone-700">{emptyCopy.intro}</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-stone-600">
          {emptyCopy.promises.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    );
  }

  const partner = intelligence.topPartner;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
        Intelligence programme
      </p>
      <p className="mt-2 text-sm text-stone-600">Première tendance détectée sur le territoire.</p>
      <article className="mt-4 rounded-xl border border-stone-100 bg-stone-50/70 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Partenaire le plus actif
        </h3>
        <p className="mt-1 text-sm font-semibold text-stone-900">{partner.name}</p>
        <p className="mt-1 text-sm text-stone-600">
          {formatAdminMetric(partner.stamps_count ?? 0)} tampons enregistrés
        </p>
      </article>
    </section>
  );
}
