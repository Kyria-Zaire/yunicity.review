"use client";

import { PartnersNetworkSignal } from "@/components/partners/command/partners-network-signal";
import { PartnersPipeline } from "@/components/partners/command/partners-pipeline";
import { PartnersPriorityActions } from "@/components/partners/command/partners-priority-actions";
import type { AdminPartnersWorkspaceSummary } from "@yunicity/types";

function PartnersCommandSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-busy="true" aria-label="Chargement du signal réseau">
      <div className="h-32 animate-pulse rounded-2xl bg-stone-100" />
      <div className="h-32 animate-pulse rounded-2xl bg-stone-100" />
      <div className="h-40 animate-pulse rounded-2xl bg-stone-100 lg:col-span-2" />
    </div>
  );
}

export function PartnersCommandCenter({
  summary,
  isLoading,
  error,
  onRetry,
}: {
  summary: AdminPartnersWorkspaceSummary | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (isLoading) {
    return <PartnersCommandSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
        {error}
        <button type="button" onClick={onRetry} className="ml-3 font-medium underline">
          Réessayer
        </button>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-4">
      <PartnersNetworkSignal summary={summary} />
      <div className="grid gap-4 lg:grid-cols-2">
        <PartnersPipeline summary={summary} />
        <PartnersPriorityActions summary={summary} />
      </div>
    </div>
  );
}
