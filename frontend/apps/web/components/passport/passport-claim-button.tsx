"use client";

import { yunicityBtnPrimary } from "@/lib/brand-classes";
import { challengeClaimButtonLabel } from "@yunicity/utils";

type PassportClaimButtonProps = {
  challengeCode: string;
  ymReward: number;
  isLoading: boolean;
  disabled?: boolean;
  onClaim: (challengeCode: string) => void;
};

export function PassportClaimButton({
  challengeCode,
  ymReward,
  isLoading,
  disabled = false,
  onClaim,
}: PassportClaimButtonProps) {
  const label = isLoading ? "Réclamation en cours…" : challengeClaimButtonLabel(ymReward);

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      onClick={() => onClaim(challengeCode)}
      className={`${yunicityBtnPrimary} min-h-11 w-full sm:w-auto`}
    >
      {label}
    </button>
  );
}
