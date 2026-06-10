import type { PartnerOffersCatalogSignal } from "@yunicity/utils";

const SIGNAL_DOT: Record<PartnerOffersCatalogSignal["type"], string> = {
  empty: "bg-stone-400",
  pending: "bg-amber-500",
  published: "bg-emerald-500",
  expired: "bg-orange-500",
};

const SIGNAL_CONTAINER: Record<PartnerOffersCatalogSignal["type"], string> = {
  empty: "border-stone-200 bg-stone-50/80",
  pending: "border-amber-200 bg-amber-50/60",
  published: "border-emerald-200 bg-emerald-50/60",
  expired: "border-orange-200 bg-orange-50/60",
};

export function PassportOffersSignal({ signal }: { signal: PartnerOffersCatalogSignal }) {
  return (
    <section
      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 shadow-sm ${SIGNAL_CONTAINER[signal.type]}`}
      aria-labelledby="passport-offers-signal-title"
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${SIGNAL_DOT[signal.type]}`}
        aria-hidden
      />
      <div className="min-w-0">
        <h2 id="passport-offers-signal-title" className="text-sm font-semibold text-stone-950">
          {signal.title}
        </h2>
        <p className="text-xs text-stone-600">{signal.description}</p>
      </div>
    </section>
  );
}
