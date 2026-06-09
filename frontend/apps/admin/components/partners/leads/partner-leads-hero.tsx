import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

type PartnerLeadsHeroProps = {
  onAddProspect?: () => void;
  canCreate: boolean;
};

export function PartnerLeadsHero({ onAddProspect, canCreate }: PartnerLeadsHeroProps) {
  return (
    <header className="space-y-4">
      <Link
        href="/partners"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-yunicity-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour réseau partenaires
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Pipeline terrain
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
            Prospects partenaires
          </h1>
          <p className="text-sm font-medium text-stone-700">
            Transformez les contacts terrain en partenaires Yunicity.
          </p>
          <p className="text-sm leading-relaxed text-stone-600">
            Suivez les commerces, associations, lieux et organisations depuis le premier contact
            jusqu&apos;à leur intégration au réseau.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {canCreate && onAddProspect ? (
            <button
              type="button"
              onClick={onAddProspect}
              className="inline-flex items-center gap-2 rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Ajouter un prospect
            </button>
          ) : (
            <Link
              href="/partner-leads"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
            >
              Voir le pipeline
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
