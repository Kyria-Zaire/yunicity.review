"use client";

import { yunicityBtnPrimary } from "@/lib/brand-classes";

type PassportErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function PassportErrorState({ message, onRetry }: PassportErrorStateProps) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-red-200/80 bg-white p-8 text-center shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-red-600">Passport</p>
      <h2 className="mt-2 text-xl font-bold text-neutral-900">Chargement impossible</h2>
      <p className="mt-2 text-sm text-neutral-600">{message}</p>
      <button type="button" onClick={onRetry} className={`mt-6 ${yunicityBtnPrimary}`}>
        Réessayer
      </button>
    </div>
  );
}
