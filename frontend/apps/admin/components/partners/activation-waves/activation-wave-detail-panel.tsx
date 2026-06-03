"use client";

import { ActivationWaveItemsTable } from "@/components/partners/activation-waves/activation-wave-items-table";
import type { AdminActivationWaveDetail, AdminActivationWaveUpdatePayload } from "@yunicity/types";
import { activationWaveStatusLabel } from "@yunicity/utils";

interface ActivationWaveDetailPanelProps {
  detail: AdminActivationWaveDetail;
  isPatching: boolean;
  patchingItemId: string | null;
  onBack: () => void;
  onPatchItem: (itemId: string, payload: AdminActivationWaveUpdatePayload) => void;
}

export function ActivationWaveDetailPanel({
  detail,
  isPatching,
  patchingItemId,
  onBack,
  onPatchItem,
}: ActivationWaveDetailPanelProps) {
  const { wave, items } = detail;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 text-xs font-medium text-stone-600 hover:text-stone-900"
          >
            ← Retour aux vagues
          </button>
          <h3 className="text-lg font-semibold text-stone-900">{wave.name}</h3>
          <p className="font-mono text-xs text-stone-500">{wave.code}</p>
          {wave.description ? (
            <p className="mt-2 max-w-2xl text-sm text-stone-600">{wave.description}</p>
          ) : (
            <p className="mt-2 text-sm text-stone-400">Aucune description.</p>
          )}
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
          {activationWaveStatusLabel(wave.status)}
        </span>
      </div>

      <ActivationWaveItemsTable
        items={items}
        isPatching={isPatching}
        patchingItemId={patchingItemId}
        onPatchItem={onPatchItem}
      />
    </section>
  );
}
