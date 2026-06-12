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

const TIER_HUMAN_SUBTITLES: Record<string, string> = {
  basic: "Tes premiers pas",
  silver: "Citoyen engagé",
  gold: "Ambassadeur local",
  neo_arrivant: "Nouveau citoyen",
  business: "Acteur local",
  press_creator: "Relais local",
};

export type PassportHeroContextInput = {
  passportStatus: string;
  passportTier: string | null;
  earnedBadges: number;
};

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

export function formatPassportTierHumanSubtitle(tier: string | null | undefined): string | null {
  if (!tier) {
    return null;
  }
  return TIER_HUMAN_SUBTITLES[tier] ?? null;
}

/** Secondary hero copy — strict priority: suspended → gold → badge milestones. */
export function getPassportHeroContextMessage(input: PassportHeroContextInput): string {
  if (input.passportStatus === "suspended") {
    return "Ton Passport est momentanément indisponible.";
  }
  if (input.passportTier === "gold") {
    return "Tu inspires la communauté Yunicity.";
  }
  const earnedBadges = input.earnedBadges;
  if (earnedBadges === 0) {
    return "Chaque action dans ta ville construit ton histoire.";
  }
  if (earnedBadges <= 2) {
    return "Tu commences à laisser ton empreinte locale.";
  }
  if (earnedBadges <= 5) {
    return "Tu participes activement à la vie de ta ville.";
  }
  return "Ton engagement fait déjà la différence.";
}

export function getWalletContextMessage(wallet: {
  balance: number;
  lifetime_earned: number;
}): string {
  if (wallet.lifetime_earned > 0) {
    return `Tu as déjà gagné ${wallet.lifetime_earned.toLocaleString("fr-FR")} YM grâce à tes actions.`;
  }
  if (wallet.balance === 0) {
    return "Tes premières actions locales te permettront de gagner des YM.";
  }
  return "La YuniMonnaie récompense ton engagement local.";
}

export function getReputationContextMessage(totalPoints: number): string {
  if (totalPoints === 0) {
    return "Chaque action locale contribue à ta réputation.";
  }
  if (totalPoints > 100) {
    return "Tu fais partie des habitants les plus engagés.";
  }
  return "Ta réputation reflète ton implication citoyenne.";
}

export function getChallengeMotivationMessage(
  progress: number,
  target: number,
  completed: boolean,
): string {
  if (completed) {
    return "Défi terminé 🎉";
  }
  if (progress === 0) {
    return "Commence ce défi pour progresser.";
  }
  const remaining = Math.max(0, target - progress);
  if (remaining === 1) {
    return "Plus qu'une action pour réussir.";
  }
  if (remaining <= 3) {
    return `Encore ${remaining} actions.`;
  }
  return "Continue tes découvertes.";
}

export function formatClaimSuccessBanner(result: {
  claimed: boolean;
  ym_awarded: number;
  message: string;
}): string {
  if (result.claimed) {
    return `+${result.ym_awarded.toLocaleString("fr-FR")} YM ajoutés à ton portefeuille.`;
  }
  if (result.message.toLowerCase().includes("déjà")) {
    return "Cette récompense a déjà été récupérée.";
  }
  return result.message;
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
    return "Impossible de contacter Yunicity.";
  }
  if (error.code === "YUNI_WALLET_SUSPENDED") {
    return "Ton portefeuille est temporairement indisponible.";
  }
  if (error.code === "PASSPORT_CHALLENGE_NOT_COMPLETED") {
    return "Termine ce défi pour obtenir ta récompense.";
  }
  if (error.code === "PASSPORT_CHALLENGE_NOT_STARTED") {
    return "Commence ce défi pour progresser.";
  }
  return error.message || fallback;
}
