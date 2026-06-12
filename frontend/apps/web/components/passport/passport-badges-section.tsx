"use client";

import type { PassportBadgesResponse } from "@yunicity/types";

import { PassportBadgeCard } from "./passport-badge-card";
import { PassportEmptyState } from "./passport-empty-state";

type PassportBadgesSectionProps = {
  badges: PassportBadgesResponse;
};

export function PassportBadgesSection({ badges }: PassportBadgesSectionProps) {
  const earned = badges.earned;
  const locked = badges.locked;

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-yunicity-primary">Badges</p>
        <h2 className="mt-2 text-2xl font-bold text-neutral-900">Badges obtenus</h2>
        {earned.length === 0 ? (
          <div className="mt-4">
            <PassportEmptyState
              title="Aucun badge pour l'instant"
              description="Explorez la ville, participez aux événements et complétez des défis pour débloquer vos premiers badges."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {earned.map((badge) => (
              <PassportBadgeCard key={badge.code} badge={badge} variant="earned" />
            ))}
          </div>
        )}
      </div>

      {locked.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">À débloquer</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Les badges secrets non obtenus ne sont pas affichés ici.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {locked.map((badge) => (
              <PassportBadgeCard key={badge.code} badge={badge} variant="locked" />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
