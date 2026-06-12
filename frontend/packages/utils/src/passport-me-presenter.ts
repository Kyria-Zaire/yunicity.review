/** Presenters for citizen Passport V2 UI (PASSPORT-05B). */

import type { PassportTierCode } from "@yunicity/types";

import { isAuthError } from "./auth/auth-errors";
import { PASSPORT_TIER_LABELS } from "./passport-level-labels";

const TIER_CODES = new Set<string>([
  "basic",
  "silver",
  "gold",
  "neo_arrivant",
  "press_creator",
  "business",
]);

export function formatChallengeProgressPercent(progress: number, target: number): number {
  if (target <= 0) {
    return 0;
  }
  const ratio = (progress / target) * 100;
  return Math.min(100, Math.max(0, Math.round(ratio)));
}

export function formatPassportTierLabel(tier: string | null | undefined): string {
  if (!tier) {
    return "Citoyen·ne";
  }
  if (TIER_CODES.has(tier)) {
    return PASSPORT_TIER_LABELS[tier as PassportTierCode];
  }
  return tier;
}

export function formatPassportStatusLabel(status: string): string {
  if (status === "active") {
    return "Actif";
  }
  if (status === "suspended") {
    return "Suspendu";
  }
  return status;
}

export function challengeClaimButtonLabel(ymReward: number): string {
  if (ymReward <= 0) {
    return "Réclamer la récompense";
  }
  return `Réclamer ${ymReward} YM`;
}

export function humanizeChallengeClaimError(error: unknown, fallback: string): string {
  if (!isAuthError(error)) {
    return fallback;
  }
  if (error.code === "YUNI_WALLET_SUSPENDED") {
    return "Votre portefeuille YuniMonnaie est suspendu. Réactivez-le pour réclamer cette récompense.";
  }
  if (error.code === "PASSPORT_CHALLENGE_NOT_COMPLETED") {
    return "Ce défi n'est pas encore terminé.";
  }
  if (error.code === "PASSPORT_CHALLENGE_NOT_STARTED") {
    return "Vous n'avez pas encore commencé ce défi.";
  }
  return error.message || fallback;
}
