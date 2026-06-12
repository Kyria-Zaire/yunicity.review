"use client";

import type { PassportChallengesResponse } from "@yunicity/types";
import type { ReactNode } from "react";

import { PassportChallengeCard } from "./passport-challenge-card";
import { PassportEmptyState } from "./passport-empty-state";

type PassportChallengesSectionProps = {
  challenges: PassportChallengesResponse;
  claimingCode: string | null;
  onClaim: (challengeCode: string) => void;
};

function ChallengeGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

export function PassportChallengesSection({
  challenges,
  claimingCode,
  onClaim,
}: PassportChallengesSectionProps) {
  const hasAny =
    challenges.active.length > 0 ||
    challenges.completed.length > 0 ||
    challenges.claimable.length > 0;

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-yunicity-primary">Défis</p>
        <h2 className="mt-2 text-2xl font-bold text-neutral-900">Vos défis locaux</h2>
      </div>

      {!hasAny ? (
        <PassportEmptyState
          title="Aucun défi pour l'instant"
          description="De nouveaux défis apparaîtront au fil de votre participation dans la ville."
        />
      ) : (
        <>
          {challenges.claimable.length > 0 ? (
            <ChallengeGroup
              title="Récompenses à réclamer"
              description="Ces défis sont terminés — réclamez votre YuniMonnaie."
            >
              {challenges.claimable.map((challenge) => (
                <PassportChallengeCard
                  key={challenge.code}
                  challenge={challenge}
                  variant="claimable"
                  claimingCode={claimingCode}
                  onClaim={onClaim}
                />
              ))}
            </ChallengeGroup>
          ) : (
            <PassportEmptyState
              title="Aucune récompense à réclamer"
              description="Terminez un défi pour débloquer une récompense YuniMonnaie."
            />
          )}

          {challenges.active.length > 0 ? (
            <ChallengeGroup title="Défis actifs">
              {challenges.active.map((challenge) => (
                <PassportChallengeCard
                  key={challenge.code}
                  challenge={challenge}
                  variant="active"
                  claimingCode={claimingCode}
                  onClaim={onClaim}
                />
              ))}
            </ChallengeGroup>
          ) : null}

          {challenges.completed.length > 0 ? (
            <ChallengeGroup title="Défis complétés">
              {challenges.completed.map((challenge) => (
                <PassportChallengeCard
                  key={challenge.code}
                  challenge={challenge}
                  variant="completed"
                  claimingCode={claimingCode}
                  onClaim={onClaim}
                />
              ))}
            </ChallengeGroup>
          ) : null}
        </>
      )}
    </section>
  );
}
