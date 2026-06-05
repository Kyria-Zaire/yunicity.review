"use client";

interface StaffHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function StaffHeader({ isLoading, onRefresh }: StaffHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Staff plateforme</h1>
        <p className="mt-1 text-sm text-stone-600">
          Comptes avec accès staff Yunicity — lecture seule (ADMIN-08C).
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Actualisation…" : "Actualiser"}
      </button>
    </header>
  );
}
