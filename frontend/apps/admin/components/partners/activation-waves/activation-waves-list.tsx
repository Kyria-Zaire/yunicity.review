"use client";

import { PartnersEmptyState } from "@/components/partners/command/partners-empty-state";
import { ActivationWaveCard } from "@/components/partners/activation-waves/activation-wave-card";
import type { AdminActivationWaveListItem } from "@yunicity/types";
import { partnerEmptyStateCopy } from "@yunicity/utils";

interface ActivationWavesListProps {
  waves: AdminActivationWaveListItem[];
  selectedWaveId: string | null;
  onSelectWave: (waveId: string) => void;
  city?: string;
}

export function ActivationWavesList({
  waves,
  selectedWaveId,
  onSelectWave,
  city = "Reims",
}: ActivationWavesListProps) {
  if (waves.length === 0) {
    return <PartnersEmptyState {...partnerEmptyStateCopy("activation", city)} />;
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
