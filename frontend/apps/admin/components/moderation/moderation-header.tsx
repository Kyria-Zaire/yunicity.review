interface ModerationHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function ModerationHeader({ isLoading, onRefresh }: ModerationHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">Modération</h1>
        <p className="mt-1 text-sm text-stone-600">
          File des signalements citoyens sur les publications (feed, discussions, tribus).
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Lecture seule en V1 — les actions de résolution arrivent en ADMIN-07C/07D.
        </p>
      </div>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => void onRefresh()}
        className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 disabled:opacity-60"
      >
        Actualiser
      </button>
    </header>
  );
}
