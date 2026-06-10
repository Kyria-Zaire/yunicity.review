import { ChevronLeft, ChevronRight } from "lucide-react";

interface PassportOpsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

function resultLabel(count: number): string {
  return count === 1 ? "résultat" : "résultats";
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
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-stone-600">
      <p>
        Affichage {from}–{to} sur {total} {resultLabel(total)}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={isLoading || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50"
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-yunicity-primary-soft px-2 font-medium tabular-nums text-yunicity-primary">
          {page}
        </span>
        <button
          type="button"
          disabled={isLoading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50"
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <p className="text-stone-500">
        Lignes par page{" "}
        <span className="font-medium text-stone-700 tabular-nums">{pageSize}</span>
      </p>
    </div>
  );
}
