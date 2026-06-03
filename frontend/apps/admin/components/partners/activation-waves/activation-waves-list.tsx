"use client";

import { ActivationWaveCard } from "@/components/partners/activation-waves/activation-wave-card";
import type { AdminActivationWaveListItem } from "@yunicity/types";

interface ActivationWavesListProps {
  waves: AdminActivationWaveListItem[];
  selectedWaveId: string | null;
  onSelectWave: (waveId: string) => void;
}

export function ActivationWavesList({
  waves,
  selectedWaveId,
  onSelectWave,
}: ActivationWavesListProps) {
  if (waves.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-600">
        Aucune vague d&apos;activation pour le moment.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {waves.map((wave) => (
        <ActivationWaveCard
          key={wave.id}
          wave={wave}
          isSelected={selectedWaveId === wave.id}
          onOpen={() => onSelectWave(wave.id)}
        />
      ))}
    </div>
  );
}
