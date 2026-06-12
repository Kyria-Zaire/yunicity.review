/** Presenters for citizen Passport V2 UI (PASSPORT-05B). */

import type { PassportTierCode } from "@yunicity/types";

import { isAuthError } from "./auth/auth-errors";
import { isPassportNotActiveError } from "./passport-labels";
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

export const PASSPORT_SESSION_EXPIRED_MESSAGE =
  "Session expirée. Reconnectez-vous pour consulter votre Passport.";

export function isSessionExpiredAuthError(error: unknown): boolean {
  return (
    isAuthError(error) &&
    error.status === 401 &&
    (error.code === "UNAUTHORIZED" || error.message.includes("Session expirée"))
  );
}

export function challengeClaimButtonLabel(ymReward: number): string {
  if (ymReward <= 0) {
    return "Réclamer la récompense";
  }
  return `Réclamer ${ymReward} YM`;
}

/** FastAPI 404 when `/me/passport` routes are missing (backend not on PASSPORT-05A). */
export function isPassportMeApiUnavailableError(error: unknown): boolean {
  return (
    isAuthError(error) &&
    error.status === 404 &&
    (error.code === "UNKNOWN_ERROR" || error.code === "NOT_FOUND") &&
    error.message === "Not Found"
  );
}

export function humanizePassportMeLoadError(error: unknown, fallback: string): string {
  if (isSessionExpiredAuthError(error)) {
    return PASSPORT_SESSION_EXPIRED_MESSAGE;
  }
  if (isPassportMeApiUnavailableError(error)) {
    return "L'API Passport V2 n'est pas disponible sur ce serveur. Mettez à jour et redémarrez le backend (PASSPORT-05A).";
  }
  if (isPassportNotActiveError(error)) {
    return "Aucun Passport actif. Activez votre Passport pour continuer.";
  }
  if (isAuthError(error)) {
    if (error.code === "PASSPORT_CITY_REQUIRED") {
      return "Indiquez votre ville dans votre profil avant d'activer le Passport.";
    }
    return error.message || fallback;
  }
  return fallback;
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
