"use client";

import type { PassportSummaryResponse } from "@yunicity/types";
import { Award, Coins, Flag, Gift, Star } from "lucide-react";
import type { ReactNode } from "react";

type PassportStatsGridProps = {
  summary: PassportSummaryResponse;
};

type StatItem = {
  label: string;
  value: string;
  icon: ReactNode;
};

export function PassportStatsGrid({ summary }: PassportStatsGridProps) {
  const items: StatItem[] = [
    {
      label: "Réputation",
      value: summary.reputation.toLocaleString("fr-FR"),
      icon: <Star className="h-4 w-4 text-amber-500" aria-hidden />,
    },
    {
      label: "YuniMonnaie",
      value: `${summary.wallet_balance.toLocaleString("fr-FR")} YM`,
      icon: <Coins className="h-4 w-4 text-yunicity-primary" aria-hidden />,
    },
    {
      label: "Badges gagnés",
      value: summary.earned_badges.toLocaleString("fr-FR"),
      icon: <Award className="h-4 w-4 text-violet-500" aria-hidden />,
    },
    {
      label: "Défis actifs",
      value: summary.active_challenges.toLocaleString("fr-FR"),
      icon: <Flag className="h-4 w-4 text-sky-500" aria-hidden />,
    },
    {
      label: "Récompenses à réclamer",
      value: summary.claimable_rewards.toLocaleString("fr-FR"),
      icon: <Gift className="h-4 w-4 text-emerald-500" aria-hidden />,
    },
  ];

  return (
    <section aria-label="Statistiques Passport">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-neutral-500">
              {item.icon}
              <p className="text-xs font-medium uppercase tracking-wide">{item.label}</p>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-neutral-900">{item.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
