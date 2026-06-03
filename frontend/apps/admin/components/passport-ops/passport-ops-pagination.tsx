interface PassportOpsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function PassportOpsPagination({
  page,
  totalPages,
  total,
  pageSize,
  isLoading,
  onPageChange,
}: PassportOpsPaginationProps) {
  if (total === 0) {
    return null;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
      <p>
        Affichage {from}–{to} sur {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isLoading || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          Précédent
        </button>
        <span className="tabular-nums text-stone-500">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={isLoading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
