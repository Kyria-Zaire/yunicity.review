"use client";

import type { PassportReputationResponse } from "@yunicity/types";
import { getReputationContextMessage } from "@yunicity/utils";

type PassportReputationCardProps = {
  reputation: PassportReputationResponse;
};

export function PassportReputationCard({ reputation }: PassportReputationCardProps) {
  const contextMessage = getReputationContextMessage(reputation.total_points);

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-yunicity-primary">Réputation</p>
      <h2 className="mt-2 text-xl font-bold text-neutral-900">Ta crédibilité locale</h2>
      <p className="mt-4 text-4xl font-bold tabular-nums text-neutral-900">
        {reputation.total_points.toLocaleString("fr-FR")}
        <span className="ml-2 text-lg font-semibold text-neutral-500">points</span>
      </p>
      <p className="mt-4 text-sm leading-relaxed text-neutral-600">{contextMessage}</p>
    </section>
  );
}
