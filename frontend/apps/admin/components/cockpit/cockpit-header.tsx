import { formatGeneratedAt } from "@yunicity/utils";

export function CockpitHeader({
  city,
  generatedAt,
  onRefresh,
  isRefreshing,
}: {
  city: string;
  generatedAt: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
          Cockpit Yunicity
        </h1>
        <p className="mt-1 text-sm text-stone-600">Vue opérationnelle {city}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white">
            {city}
          </span>
          {generatedAt ? (
            <span className="text-xs text-stone-500">
              Mis à jour {formatGeneratedAt(generatedAt)}
            </span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-60"
      >
        {isRefreshing ? "Actualisation…" : "Actualiser"}
      </button>
    </header>
  );
}
