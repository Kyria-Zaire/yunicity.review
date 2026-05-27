"use client";

import { TribeDiscoveryCard } from "@/components/search/tribe-discovery-card";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { Tribe } from "@yunicity/types";
import { TRIBE_INVITATION_CTA, tribeDiscoveryActionLabel, tribeHref } from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

type EventsTribeChipProps = {
  tribe: Tribe;
  city: string;
  compact?: boolean;
};

export function EventsTribeChip({ tribe, city, compact = true }: EventsTribeChipProps) {
  const api = useYunicityApi();
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionLabel = tribeDiscoveryActionLabel(tribe);

  async function handleAction() {
    if (tribe.viewer_is_member || tribe.visibility === "private_invite") {
      router.push(tribeHref(tribe.slug, city));
      return;
    }
    setJoining(true);
    setError(null);
    try {
      await api.tribes.joinTribe(tribe.slug, city, { charter_accepted: true });
      router.push(tribeHref(tribe.slug, city));
    } catch {
      setError("Impossible de rejoindre la tribu pour le moment.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="space-y-1">
      <TribeDiscoveryCard
        tribe={tribe}
        compact={compact}
        actionLabel={actionLabel}
        disabled={joining}
        onAction={() => void handleAction()}
      />
      {actionLabel === TRIBE_INVITATION_CTA ? (
        <p className="text-xs text-neutral-500">Sur invitation uniquement.</p>
      ) : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
