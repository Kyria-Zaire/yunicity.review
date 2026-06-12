"use client";

import type { PassportChallengeResponse } from "@yunicity/types";
import { formatChallengeProgressPercent } from "@yunicity/utils";

import { PassportClaimButton } from "./passport-claim-button";

type PassportChallengeCardProps = {
  challenge: PassportChallengeResponse;
  variant: "active" | "completed" | "claimable";
  claimingCode: string | null;
  onClaim: (challengeCode: string) => void;
};

export function PassportChallengeCard({
  challenge,
  variant,
  claimingCode,
  onClaim,
}: PassportChallengeCardProps) {
  const percent = formatChallengeProgressPercent(challenge.progress, challenge.target);
  const showClaim = variant === "claimable" || (challenge.completed && !challenge.reward_claimed);
  const isClaiming = claimingCode === challenge.code;

  return (
    <article className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-neutral-900">{challenge.name}</h3>
          <p className="mt-1 text-sm text-neutral-600">{challenge.description}</p>
        </div>
        {challenge.ym_reward > 0 ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            +{challenge.ym_reward} YM
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Progression</span>
          <span className="tabular-nums">
            {challenge.progress.toLocaleString("fr-FR")} / {challenge.target.toLocaleString("fr-FR")} ({percent}
            %)
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progression du défi ${challenge.name}`}
        >
          <div
            className="h-full rounded-full bg-yunicity-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {variant === "completed" && challenge.reward_claimed ? (
        <p className="mt-4 text-sm font-medium text-emerald-700">Récompense déjà réclamée</p>
      ) : null}

      {showClaim ? (
        <div className="mt-4">
          <PassportClaimButton
            challengeCode={challenge.code}
            ymReward={challenge.ym_reward}
            isLoading={isClaiming}
            onClaim={onClaim}
          />
        </div>
      ) : null}
    </article>
  );
}
