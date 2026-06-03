"use client";

import type { AdminActivationWaveListItem } from "@yunicity/types";
import {
  activationWaveStatusLabel,
  waveActivationProgressPercent,
} from "@yunicity/utils";

interface ActivationWaveCardProps {
  wave: AdminActivationWaveListItem;
  isSelected: boolean;
  onOpen: () => void;
}

export function ActivationWaveCard({ wave, isSelected, onOpen }: ActivationWaveCardProps) {
  const progress = waveActivationProgressPercent(wave);

  return (
    <article
      className={`rounded-xl border p-4 shadow-sm transition-colors ${
        isSelected
          ? "border-stone-400 bg-stone-50 ring-1 ring-stone-300"
          : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-stone-900">{wave.name}</h3>
          <p className="mt-0.5 font-mono text-xs text-stone-500">{wave.code}</p>
        </div>
        <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
          {activationWaveStatusLabel(wave.status)}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-stone-50 px-2 py-1.5">
          <dt className="text-stone-500">Total</dt>
          <dd className="font-semibold text-stone-900">{wave.items_total}</dd>
        </div>
        <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
          <dt className="text-emerald-700">Prêts</dt>
          <dd className="font-semibold text-emerald-900">{wave.items_ready}</dd>
        </div>
        <div className="rounded-lg bg-sky-50 px-2 py-1.5">
          <dt className="text-sky-700">Activés</dt>
          <dd className="font-semibold text-sky-900">{wave.items_activated}</dd>
        </div>
      </dl>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-stone-500">
          <span>Progression activations</span>
          <span>{progress}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-stone-100"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progression ${wave.name}`}
        >
          <div
            className="h-full rounded-full bg-sky-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 w-full rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800"
      >
        Ouvrir
      </button>
    </article>
  );
}
