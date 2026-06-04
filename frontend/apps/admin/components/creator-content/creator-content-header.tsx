interface CreatorContentHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function CreatorContentHeader({ isLoading, onRefresh }: CreatorContentHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
          Contenus créateurs
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Modération des contenus éditoriaux proposés par les partenaires vérifiés.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          La création et la soumission restent dans le portail organisation partenaire.
        </p>
      </div>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => void onRefresh()}
        className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Actualisation…" : "Actualiser"}
      </button>
    </header>
  );
}
