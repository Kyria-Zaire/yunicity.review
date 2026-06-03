"use client";

import { ActivationWaveDetailPanel } from "@/components/partners/activation-waves/activation-wave-detail-panel";
import { ActivationWavesHeader } from "@/components/partners/activation-waves/activation-waves-header";
import { ActivationWavesList } from "@/components/partners/activation-waves/activation-waves-list";
import { useAdminActivationWaveDetail } from "@/lib/hooks/use-admin-activation-wave-detail";
import { useAdminActivationWaves } from "@/lib/hooks/use-admin-activation-waves";
import type { AdminActivationWaveUpdatePayload } from "@yunicity/types";
import { useCallback, useEffect, useState } from "react";

export function PartnersActivationTab() {
  const { waves, isLoading: wavesLoading, error: wavesError, reload: reloadWaves } =
    useAdminActivationWaves();
  const [selectedWaveId, setSelectedWaveId] = useState<string | null>(null);
  const [patchingItemId, setPatchingItemId] = useState<string | null>(null);

  const {
    data: detail,
    isLoading: detailLoading,
    error: detailError,
    reload: reloadDetail,
    updateItem,
    isPatching,
    patchError,
    patchSuccess,
    clearPatchFeedback,
  } = useAdminActivationWaveDetail(selectedWaveId);

  useEffect(() => {
    if (!patchSuccess && !patchError) {
      return;
    }
    const timer = window.setTimeout(() => clearPatchFeedback(), 4000);
    return () => window.clearTimeout(timer);
  }, [patchSuccess, patchError, clearPatchFeedback]);

  const handlePatchItem = useCallback(
    async (itemId: string, payload: AdminActivationWaveUpdatePayload) => {
      setPatchingItemId(itemId);
      const ok = await updateItem(itemId, payload);
      setPatchingItemId(null);
      if (ok) {
        void reloadWaves();
      }
    },
    [updateItem, reloadWaves],
  );

  const showList = selectedWaveId === null;

  return (
    <div className="space-y-6">
      <ActivationWavesHeader />

      {patchSuccess ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {patchSuccess}
        </p>
      ) : null}
      {patchError ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
        >
          {patchError}
        </p>
      ) : null}

      {showList ? (
        <>
          {wavesLoading ? (
            <p className="text-sm text-stone-500">Chargement des vagues…</p>
          ) : null}
          {wavesError ? (
            <div className="space-y-2">
              <p role="alert" className="text-sm text-rose-700">
                {wavesError}
              </p>
              <button
                type="button"
                onClick={() => void reloadWaves()}
                className="text-sm font-medium text-stone-800 underline-offset-2 hover:underline"
              >
                Réessayer
              </button>
            </div>
          ) : null}
          {!wavesLoading && !wavesError ? (
            <ActivationWavesList
              waves={waves}
              selectedWaveId={selectedWaveId}
              onSelectWave={setSelectedWaveId}
            />
          ) : null}
        </>
      ) : (
        <>
          {detailLoading ? (
            <p className="text-sm text-stone-500">Chargement du détail de la vague…</p>
          ) : null}
          {detailError ? (
            <div className="space-y-2">
              <p role="alert" className="text-sm text-rose-700">
                {detailError}
              </p>
              <button
                type="button"
                onClick={() => void reloadDetail()}
                className="text-sm font-medium text-stone-800 underline-offset-2 hover:underline"
              >
                Réessayer
              </button>
              <button
                type="button"
                onClick={() => setSelectedWaveId(null)}
                className="ml-4 text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
              >
                Retour
              </button>
            </div>
          ) : null}
          {!detailLoading && !detailError && detail ? (
            <ActivationWaveDetailPanel
              detail={detail}
              isPatching={isPatching}
              patchingItemId={patchingItemId}
              onBack={() => setSelectedWaveId(null)}
              onPatchItem={(itemId, payload) => void handlePatchItem(itemId, payload)}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
