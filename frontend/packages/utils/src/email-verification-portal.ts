/**
 * Confirmation d'adresse e-mail — logique de présentation (AUTH-01).
 *
 * Tout ce qui décide de l'état affiché vit ici, hors de React : l'écran se
 * contente de rendre `EmailVerificationView`. C'est ce qui rend la machine à
 * états testable sans monter de composant.
 */

import { isAuthError } from "./auth/auth-errors";
import {
  VERIFY_EMAIL_ALREADY_USED_BODY,
  VERIFY_EMAIL_ALREADY_USED_TITLE,
  VERIFY_EMAIL_CHECKING_BODY,
  VERIFY_EMAIL_CHECKING_TITLE,
  VERIFY_EMAIL_EXPIRED_BODY,
  VERIFY_EMAIL_EXPIRED_TITLE,
  VERIFY_EMAIL_FAILURE_BODY,
  VERIFY_EMAIL_INVALID_BODY,
  VERIFY_EMAIL_INVALID_TITLE,
  VERIFY_EMAIL_PAGE_TITLE,
  VERIFY_EMAIL_PENDING_BODY,
  VERIFY_EMAIL_PENDING_TITLE,
  VERIFY_EMAIL_RESEND_VALIDATION_EMAIL,
  VERIFY_EMAIL_SUCCESS_BODY,
  VERIFY_EMAIL_SUCCESS_TITLE,
} from "./email-verification-portal-labels";

/**
 * `pending` couvre l'arrivée sans jeton (juste après l'inscription, ou depuis un
 * lien de renvoi) ; les états d'échec sont distincts pour proposer la bonne
 * action plutôt qu'un message unique et vague.
 */
export type EmailVerificationStatus =
  | "pending"
  | "checking"
  | "verified"
  | "invalid"
  | "expired"
  | "already_used"
  | "failed";

export type EmailVerificationView = {
  status: EmailVerificationStatus;
  title: string;
  body: string;
  /** Le renvoi n'a de sens que si la confirmation n'a pas abouti. */
  canResend: boolean;
  /** Un compte confirmé, ou déjà confirmé, mène à la connexion. */
  showLoginCta: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Statut d'arrivée sur la page.
 *
 * Sans jeton, l'utilisateur vient de s'inscrire ou cherche à renvoyer un lien :
 * on ne lui affiche pas une erreur, mais l'état d'attente.
 */
export function resolveInitialVerificationStatus(
  token: string | null | undefined,
): EmailVerificationStatus {
  return token?.trim() ? "checking" : "pending";
}

/** Traduit l'échec renvoyé par l'API en état d'interface. */
export function resolveVerificationFailure(error: unknown): EmailVerificationStatus {
  if (!isAuthError(error)) {
    return "failed";
  }
  switch (error.code) {
    case "INVALID_VERIFICATION_TOKEN":
      return "invalid";
    case "VERIFICATION_TOKEN_EXPIRED":
      return "expired";
    case "VERIFICATION_TOKEN_ALREADY_USED":
      return "already_used";
    default:
      return "failed";
  }
}

export function buildEmailVerificationView(
  status: EmailVerificationStatus,
): EmailVerificationView {
  switch (status) {
    case "checking":
      return {
        status,
        title: VERIFY_EMAIL_CHECKING_TITLE,
        body: VERIFY_EMAIL_CHECKING_BODY,
        canResend: false,
        showLoginCta: false,
      };
    case "verified":
      return {
        status,
        title: VERIFY_EMAIL_SUCCESS_TITLE,
        body: VERIFY_EMAIL_SUCCESS_BODY,
        canResend: false,
        showLoginCta: true,
      };
    case "invalid":
      return {
        status,
        title: VERIFY_EMAIL_INVALID_TITLE,
        body: VERIFY_EMAIL_INVALID_BODY,
        canResend: true,
        showLoginCta: false,
      };
    case "expired":
      return {
        status,
        title: VERIFY_EMAIL_EXPIRED_TITLE,
        body: VERIFY_EMAIL_EXPIRED_BODY,
        canResend: true,
        showLoginCta: false,
      };
    case "already_used":
      return {
        status,
        title: VERIFY_EMAIL_ALREADY_USED_TITLE,
        body: VERIFY_EMAIL_ALREADY_USED_BODY,
        // Un lien déjà consommé signifie souvent que le compte est confirmé :
        // la connexion est la sortie la plus probable, le renvoi reste offert.
        canResend: true,
        showLoginCta: true,
      };
    case "failed":
      return {
        status,
        title: VERIFY_EMAIL_PAGE_TITLE,
        body: VERIFY_EMAIL_FAILURE_BODY,
        canResend: true,
        showLoginCta: false,
      };
    case "pending":
    default:
      return {
        status: "pending",
        title: VERIFY_EMAIL_PENDING_TITLE,
        body: VERIFY_EMAIL_PENDING_BODY,
        canResend: true,
        showLoginCta: false,
      };
  }
}

export function normalizeVerificationEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateResendVerificationEmail(email: string): {
  valid: boolean;
  message: string | null;
} {
  if (!EMAIL_PATTERN.test(normalizeVerificationEmail(email))) {
    return { valid: false, message: VERIFY_EMAIL_RESEND_VALIDATION_EMAIL };
  }
  return { valid: true, message: null };
}

export function buildResendVerificationPayload(email: string): { email: string } {
  return { email: normalizeVerificationEmail(email) };
}

/**
 * L'invitation à confirmer ne s'affiche que pour un compte connecté non vérifié.
 *
 * Elle ne bloque rien : les comptes créés avant l'entrée en vigueur de
 * l'exigence gardent un accès complet, et cette bannière est une proposition,
 * pas une barrière.
 */
export function shouldInviteEmailVerification(
  user: { is_verified: boolean } | null | undefined,
): boolean {
  return Boolean(user) && user?.is_verified === false;
}
