"use client";

import type { PassportTierCode } from "@yunicity/types";
import { PASSPORT_TIER_LABELS } from "@yunicity/utils";
import Link from "next/link";

import { WebContextPanel } from "@/components/layout/web-context-panel";
import { usePassportOverview } from "@/hooks/use-passport-overview";
import { useVisibleActivation } from "@/hooks/use-visible-activation";

/**
 * D1.2-R3A — Passport reel du rail droit Desktop (>=1536px).
 *
 * NOTE DE CONTRAT : `PassportOverviewResponse.summary` ne porte AUCUNE
 * progression globale (`progress`/`target` n'existent qu'au niveau d'un
 * challenge). On n'affiche donc aucune barre de progression : la fabriquer a
 * partir d'un denominateur arbitraire serait une donnee inventee. Seuls les
 * compteurs reels du contrat sont rendus.
 */

function PassportShell({ children }: { children: React.ReactNode }) {
  return (
    <WebContextPanel
      title="Votre Passport local"
      action={
        <Link
          href="/passport"
          className="rounded text-xs font-semibold text-yunicity-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
        >
          Ouvrir
        </Link>
      }
    >
      {children}
    </WebContextPanel>
  );
}

function PassportCardContent() {
  const { overview, loading, error } = usePassportOverview();

  if (loading) {
    return (
      <PassportShell>
        <div
          data-feed-passport-state="loading"
          aria-hidden="true"
          className="h-16 animate-pulse rounded-xl bg-neutral-100"
        />
        <span className="sr-only">Chargement du Passport</span>
      </PassportShell>
    );
  }

  // Erreur isolee : ne masque ni « Ce soir » ni « Vos tribus ».
  if (error || !overview) return null;

  const { summary } = overview;

  // R3C — `passport_tier` est un CODE technique (`basic`, `silver`…). On ne rend
  // que sa traduction canonique, celle deja utilisee par la page Passport. Un
  // code inconnu du mapping n'est pas affiche : mieux vaut taire le niveau que
  // laisser filtrer une valeur brute dans une interface francaise.
  const tierCode = summary.passport_tier;
  const tierLabel =
    tierCode && tierCode in PASSPORT_TIER_LABELS
      ? PASSPORT_TIER_LABELS[tierCode as PassportTierCode]
      : null;

  const stats: Array<{ label: string; value: number }> = [
    { label: "Badges obtenus", value: summary.earned_badges },
    { label: "Défis en cours", value: summary.active_challenges },
  ];
  if (summary.claimable_rewards > 0) {
    stats.push({ label: "Récompenses à réclamer", value: summary.claimable_rewards });
  }

  return (
    <PassportShell>
      <ul data-feed-passport-state="loaded" className="space-y-1.5">
        {tierLabel ? (
          <li className="flex items-baseline justify-between gap-2">
            <span className="text-neutral-500">Niveau</span>
            <span className="font-semibold text-neutral-900">{tierLabel}</span>
          </li>
        ) : null}
        {stats.map((stat) => (
          <li key={stat.label} className="flex items-baseline justify-between gap-2">
            <span className="text-neutral-500">{stat.label}</span>
            <span className="font-semibold text-neutral-900">{stat.value}</span>
          </li>
        ))}
      </ul>
    </PassportShell>
  );
}

export function FeedPassportCard() {
  const { ref, activated } = useVisibleActivation<HTMLDivElement>();

  return (
    <div ref={ref} data-feed-passport-slot="" className="feed-passport-slot">
      {activated ? <PassportCardContent /> : null}
    </div>
  );
}
